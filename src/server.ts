import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database } from './database';
import type { NextFunction, Request, Response } from 'express';

const app = express();
const configuredJwtSecret = process.env['JWT_SECRET'];

if (process.env['NODE_ENV'] === 'production' && !configuredJwtSecret) {
  throw new Error('Set JWT_SECRET before running in production.');
}

const jwtSecret =
  configuredJwtSecret || 'development-only-secret-change-before-deployment';


app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthRequest = Request & { user?: SessionUser };

const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret) as SessionUser;
    next();
  } catch {
    return res.status(401).json({
      message: 'Session expired. Please sign in again.',
    });
  }
};

const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({
      message: 'Administrator access required.',
    });
  }

  next();
};

const employeeSelect = `
  SELECT
    e.id AS employeeId,
    e.name AS employeeName,
    e.email AS emailId,
    e.contact AS contactNo,
    e.department_id AS deptId,
    d.name AS deptName,
    e.role,
    e.gender
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id
`;

app.post('/api/auth/login', (req: Request, res: Response) => {
  const email = String(req.body?.emailId || '').trim();
  const password = String(req.body?.password || '');

  const employee = database
    .prepare('SELECT * FROM employees WHERE email = ?')
    .get(email) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: string;
      }
    | undefined;

  if (!employee || !bcrypt.compareSync(password, employee.password_hash)) {
    return res.status(401).json({
      message: 'Email or password is incorrect.',
    });
  }

  const user: SessionUser = {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
  };

  const token = jwt.sign(user, jwtSecret, { expiresIn: '8h' });

  return res.json({ token, user });
});

app.get('/api/departments', requireAuth, requireAdmin, (_req, res) => {
  const departments = database
    .prepare(
      'SELECT id AS deptId, name AS deptName FROM departments ORDER BY name'
    )
    .all();

  res.json(departments);
});

app.get('/api/employees', requireAuth, requireAdmin, (_req, res) => {
  const employees = database
    .prepare(`${employeeSelect} ORDER BY e.name`)
    .all();

  res.json(employees);
});

app.post('/api/employees', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const {
    employeeName,
    emailId,
    password,
    contactNo = '',
    deptId,
    gender = '',
  } = req.body || {};

  if (
    !employeeName?.trim() ||
    !emailId?.trim() ||
    !password ||
    String(password).length < 6
  ) {
    return res.status(400).json({
      message:
        'Name, email, and a password of at least 6 characters are required.',
    });
  }

  try {
    const result = database
      .prepare(`
        INSERT INTO employees(
          name, email, password_hash, contact, department_id, gender
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        String(employeeName).trim(),
        String(emailId).trim(),
        bcrypt.hashSync(String(password), 10),
        String(contactNo),
        deptId ? Number(deptId) : null,
        String(gender)
      );

    const employee = database
      .prepare(`${employeeSelect} WHERE e.id = ?`)
      .get(result.lastInsertRowid);

    return res.status(201).json(employee);
  } catch {
    return res.status(409).json({
      message: 'An employee with this email already exists.',
    });
  }
});

app.put('/api/employees/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const {
    employeeName,
    emailId,
    password,
    contactNo = '',
    deptId,
    gender = '',
  } = req.body || {};

  if (!employeeName?.trim() || !emailId?.trim()) {
    return res.status(400).json({
      message: 'Name and email are required.',
    });
  }

  if (password && String(password).length < 6) {
    return res.status(400).json({
      message: 'Password must contain at least 6 characters.',
    });
  }

  try {
    database
      .prepare(`
        UPDATE employees
        SET name = ?, email = ?, contact = ?, department_id = ?, gender = ?
        WHERE id = ?
      `)
      .run(
        String(employeeName).trim(),
        String(emailId).trim(),
        String(contactNo),
        deptId ? Number(deptId) : null,
        String(gender),
        id
      );

    if (password) {
      database
        .prepare('UPDATE employees SET password_hash = ? WHERE id = ?')
        .run(bcrypt.hashSync(String(password), 10), id);
    }

    const employee = database
      .prepare(`${employeeSelect} WHERE e.id = ?`)
      .get(id);

    return employee
      ? res.json(employee)
      : res.status(404).json({ message: 'Employee not found.' });
  } catch {
    return res.status(409).json({
      message: 'An employee with this email already exists.',
    });
  }
});

app.delete('/api/employees/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const result = database
    .prepare("DELETE FROM employees WHERE id = ? AND role <> 'Admin'")
    .run(Number(req.params['id']));

  if (!result.changes) {
    return res.status(404).json({
      message: 'Employee not found or cannot be deleted.',
    });
  }

  return res.status(204).end();
});

const leaveSelect = `
  SELECT
    l.id,
    l.employee_id AS employeeId,
    e.name AS employeeName,
    l.type,
    l.start_date AS startDate,
    l.end_date AS endDate,
    l.reason,
    l.status,
    l.created_at AS createdAt
  FROM leave_requests l
  JOIN employees e ON e.id = l.employee_id
`;

app.get('/api/leaves', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'Admin') {
    const leaves = database
      .prepare(`${leaveSelect} ORDER BY l.created_at DESC`)
      .all();

    return res.json(leaves);
  }

  const leaves = database
    .prepare(
      `${leaveSelect}
       WHERE l.employee_id = ?
       ORDER BY l.created_at DESC`
    )
    .all(req.user?.id);

  return res.json(leaves);
});

app.post('/api/leaves', requireAuth, (req: AuthRequest, res: Response) => {
  const { employeeId, type, startDate, endDate, reason = '' } = req.body || {};

  const ownerId =
    req.user?.role === 'Admin' ? Number(employeeId) : req.user?.id;

  if (
    !ownerId ||
    !type ||
    !startDate ||
    !endDate ||
    String(endDate) < String(startDate)
  ) {
    return res.status(400).json({
      message: 'Select an employee, leave type, and valid date range.',
    });
  }

  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(String(startDate)) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(endDate));

  const employeeExists = database
    .prepare('SELECT id FROM employees WHERE id = ?')
    .get(ownerId);

  if (!validDates || !employeeExists) {
    return res.status(400).json({
      message: 'Select a valid employee and date range.',
    });
  }

  const result = database
    .prepare(`
      INSERT INTO leave_requests(
        employee_id, type, start_date, end_date, reason
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      ownerId,
      String(type),
      String(startDate),
      String(endDate),
      String(reason)
    );

  const leave = database
    .prepare(`${leaveSelect} WHERE l.id = ?`)
    .get(result.lastInsertRowid);

  return res.status(201).json(leave);
});

app.patch(
  '/api/leaves/:id/status',
  requireAuth,
  requireAdmin,
  (req: Request, res: Response) => {
    const status = String(req.body?.status || '');

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid leave status.' });
    }

    const id = Number(req.params['id']);
    const result = database
      .prepare('UPDATE leave_requests SET status = ? WHERE id = ?')
      .run(status, id);

    if (!result.changes) {
      return res.status(404).json({
        message: 'Leave request not found.',
      });
    }

    const leave = database
      .prepare(`${leaveSelect} WHERE l.id = ?`)
      .get(id);

    return res.json(leave);
  }
);

app.delete('/api/leaves/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const result = database
    .prepare('DELETE FROM leave_requests WHERE id = ?')
    .run(Number(req.params['id']));

  return result.changes
    ? res.status(204).end()
    : res.status(404).json({ message: 'Leave request not found.' });
});

app.get('/api/dashboard', requireAuth, requireAdmin, (_req, res) => {
  const totalEmployees = (
    database
      .prepare("SELECT COUNT(*) AS count FROM employees WHERE role = 'Employee'")
      .get() as { count: number }
  ).count;

  const pendingApprovals = (
    database
      .prepare("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'Pending'")
      .get() as { count: number }
  ).count;

  const activeLeaves = (
    database
      .prepare(`
        SELECT COUNT(*) AS count
        FROM leave_requests
        WHERE status = 'Approved'
          AND date('now') BETWEEN start_date AND end_date
      `)
      .get() as { count: number }
  ).count;

  const leavesThisMonth = (
    database
      .prepare(`
        SELECT COUNT(*) AS count
        FROM leave_requests
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `)
      .get() as { count: number }
  ).count;

  const recentLeaves = database
    .prepare(`${leaveSelect} ORDER BY l.created_at DESC LIMIT 8`)
    .all();

  res.json({
    totalEmployees,
    activeLeaves,
    pendingApprovals,
    leavesThisMonth,
    recentLeaves,
  });
});

const browserDistFolder = join(
  process.cwd(),
  'dist/employee_leave/browser'
);

if (existsSync(join(browserDistFolder, 'index.html'))) {
  app.use(express.static(browserDistFolder));

  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(join(browserDistFolder, 'index.html'));
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

const port = Number(process.env['PORT'] || 4000);

app.listen(port, () => {
  console.log(`Employee Leave API listening on http://localhost:${port}`);
});