import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const databasePath = resolve(
  process.env['DATABASE_PATH'] || 'data/employee-leave.sqlite'
);

mkdirSync(dirname(databasePath), { recursive: true });

export const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');

database.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    gender TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'Employee'
      CHECK (role IN ('Admin', 'Employee')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const addDepartment = database.prepare(
  'INSERT OR IGNORE INTO departments(name) VALUES (?)'
);

[
  'Human Resources',
  'Engineering',
  'Finance',
  'Marketing',
  'Operations',
].forEach((name) => addDepartment.run(name));

const adminEmail = process.env['ADMIN_EMAIL'] || 'hradmin@gmail.com';
const adminPassword = process.env['ADMIN_PASSWORD'] || '112233';

const adminExists = database
  .prepare('SELECT id FROM employees WHERE email = ?')
  .get(adminEmail);

if (!adminExists) {
  database
    .prepare(`
      INSERT INTO employees(
        name, email, password_hash, contact, department_id, gender, role
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Admin')
    `)
    .run(
      'HR Administrator',
      adminEmail,
      bcrypt.hashSync(adminPassword, 10),
      '',
      1,
      ''
    );
}