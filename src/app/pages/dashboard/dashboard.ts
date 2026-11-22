import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DashboardData,
  EmployeeService,
} from '../../services/employee';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private service = inject(EmployeeService);

  data: DashboardData = {
    totalEmployees: 0,
    activeLeaves: 0,
    pendingApprovals: 0,
    leavesThisMonth: 0,
    recentLeaves: [],
  };

  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getDashboard().subscribe({
      next: (data) => (this.data = data),
      error: () => (this.errorMessage = 'Could not load dashboard data.'),
    });
  }

  setStatus(id: number, status: 'Approved' | 'Rejected'): void {
    this.service.updateLeaveStatus(id, status).subscribe({
      next: () => this.load(),
      error: () => (this.errorMessage = 'Could not update request.'),
    });
  }

  duration(start: string, end: string): number {
    return (
      Math.floor(
        (Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`)) /
          86400000
      ) + 1
    );
  }

  exportLeaves(): void {
    this.service.getLeaves().subscribe({
      next: (leaves) => {
        const rows = [
          ['Employee', 'Type', 'Start date', 'End date', 'Status', 'Reason'],
          ...leaves.map((leave) => [
            leave.employeeName,
            leave.type,
            leave.startDate,
            leave.endDate,
            leave.status,
            leave.reason,
          ]),
        ];

        const csv = rows
          .map((row) =>
            row
              .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
              .join(',')
          )
          .join('\r\n');

        const url = URL.createObjectURL(
          new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        );

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'leave-requests.csv';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => (this.errorMessage = 'Could not export leave requests.'),
    });
  }
}