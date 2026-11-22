import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EmployeeRecord,
  EmployeeService,
  LeaveRecord,
} from '../../services/employee';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './leave.html',
  styleUrl: './leave.css',
})
export class Leave implements OnInit {
  private service = inject(EmployeeService);

  leaveList: LeaveRecord[] = [];
  employees: EmployeeRecord[] = [];
  isAdmin = false;
  isFormOpen = false;
  isSaving = false;
  message = '';
  errorMessage = '';

  form = {
    employeeId: 0,
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  };

  ngOnInit(): void {
    const user = JSON.parse(
      localStorage.getItem('leaveUser') || '{}'
    ) as { id?: number; role?: string };

    this.isAdmin = user.role === 'Admin';
    this.form.employeeId = user.id || 0;
    this.loadLeaves();

    if (this.isAdmin) {
      this.service.getAllEmployee().subscribe({
        next: (items) => {
          this.employees = items.filter((item) => item.role !== 'Admin');
        },
      });
    }
  }

  loadLeaves(): void {
    this.service.getLeaves().subscribe({
      next: (items) => (this.leaveList = items),
      error: () => (this.errorMessage = 'Could not load leave requests.'),
    });
  }

  openForm(): void {
    this.message = '';
    this.errorMessage = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  submit(): void {
    this.errorMessage = '';

    if (
      !this.form.startDate ||
      !this.form.endDate ||
      this.form.endDate < this.form.startDate ||
      (this.isAdmin && !this.form.employeeId)
    ) {
      this.errorMessage = 'Choose an employee and a valid date range.';
      return;
    }

    this.isSaving = true;

    this.service.createLeave(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.isFormOpen = false;
        this.message = 'Leave request submitted.';
        this.loadLeaves();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage =
          error.error?.message || 'Could not submit request.';
      },
    });
  }

  setStatus(
    leave: LeaveRecord,
    status: 'Approved' | 'Rejected'
  ): void {
    this.service.updateLeaveStatus(leave.id, status).subscribe({
      next: (updated) => {
        this.leaveList = this.leaveList.map((item) =>
          item.id === updated.id ? updated : item
        );
        this.message = `Request ${status.toLowerCase()}.`;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Could not update request.';
      },
    });
  }

  deleteLeave(leave: LeaveRecord): void {
    if (!confirm('Delete this leave request?')) {
      return;
    }

    this.service.deleteLeave(leave.id).subscribe({
      next: () => {
        this.leaveList = this.leaveList.filter(
          (item) => item.id !== leave.id
        );
      },
      error: () => {
        this.errorMessage = 'Could not delete request.';
      },
    });
  }

  duration(leave: LeaveRecord): number {
    return (
      Math.floor(
        (Date.parse(`${leave.endDate}T00:00:00`) -
          Date.parse(`${leave.startDate}T00:00:00`)) /
          86400000
      ) + 1
    );
  }
}