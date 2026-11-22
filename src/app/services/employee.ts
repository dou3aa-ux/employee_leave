import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface EmployeeRecord {
  employeeId: number;
  employeeName: string;
  emailId: string;
  contactNo: string;
  deptId: number | null;
  deptName: string | null;
  role: string;
  gender: string;
}

export interface Department {
  deptId: number;
  deptName: string;
}

export interface LeaveRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Session {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface DashboardData {
  totalEmployees: number;
  activeLeaves: number;
  pendingApprovals: number;
  leavesThisMonth: number;
  recentLeaves: LeaveRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private http = inject(HttpClient);
  private readonly baseUrl =
  typeof window !== 'undefined' && window.location.port === '4200'
    ? `http://${window.location.hostname}:4000/api`
    : '/api';

  private headers(): HttpHeaders {
    const token =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem('leaveToken');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  login(emailId: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.baseUrl}/auth/login`, {
      emailId,
      password,
    });
  }

  getAllEmployee(): Observable<EmployeeRecord[]> {
    return this.http.get<EmployeeRecord[]>(`${this.baseUrl}/employees`, {
      headers: this.headers(),
    });
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/departments`, {
      headers: this.headers(),
    });
  }

  createEmployee(employee: Record<string, unknown>): Observable<EmployeeRecord> {
    return this.http.post<EmployeeRecord>(
      `${this.baseUrl}/employees`,
      employee,
      { headers: this.headers() }
    );
  }

  updateEmployee(
    id: number,
    employee: Record<string, unknown>
  ): Observable<EmployeeRecord> {
    return this.http.put<EmployeeRecord>(
      `${this.baseUrl}/employees/${id}`,
      employee,
      { headers: this.headers() }
    );
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`, {
      headers: this.headers(),
    });
  }

  getLeaves(): Observable<LeaveRecord[]> {
    return this.http.get<LeaveRecord[]>(`${this.baseUrl}/leaves`, {
      headers: this.headers(),
    });
  }

  createLeave(leave: Record<string, unknown>): Observable<LeaveRecord> {
    return this.http.post<LeaveRecord>(`${this.baseUrl}/leaves`, leave, {
      headers: this.headers(),
    });
  }

  updateLeaveStatus(
    id: number,
    status: string
  ): Observable<LeaveRecord> {
    return this.http.patch<LeaveRecord>(
      `${this.baseUrl}/leaves/${id}/status`,
      { status },
      { headers: this.headers() }
    );
  }

  deleteLeave(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/leaves/${id}`, {
      headers: this.headers(),
    });
  }

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`, {
      headers: this.headers(),
    });
  }
}