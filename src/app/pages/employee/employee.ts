import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Department,
  EmployeeRecord,
  EmployeeService,
} from '../../services/employee';

type EmployeeForm = {
  employeeName: string;
  emailId: string;
  contactNo: string;
  deptId: number | null;
  gender: string;
  password: string;
};

const emptyForm = (): EmployeeForm => ({
  employeeName: '',
  emailId: '',
  contactNo: '',
  deptId: null,
  gender: '',
  password: '',
});

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class Employee implements OnInit {
  private employeeService = inject(EmployeeService);

  employeeList: EmployeeRecord[] = [];
  deptList: Department[] = [];
  isModalOpen = false;
  editingId: number | null = null;
  form = emptyForm();
  searchTerm = '';
  errorMessage = '';
  successMessage = '';
  isSaving = false;

  get filteredEmployees(): EmployeeRecord[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.employeeList.filter((employee) =>
      !term ||
      [
        employee.employeeName,
        employee.emailId,
        employee.deptName || '',
      ].some((value) => value.toLowerCase().includes(term))
    );
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployee().subscribe({
      next: (items) => (this.employeeList = items),
      error: () => (this.errorMessage = 'Could not load employees.'),
    });
  }

  loadDepartments(): void {
    this.employeeService.getDepartments().subscribe({
      next: (items) => (this.deptList = items),
      error: () => (this.errorMessage = 'Could not load departments.'),
    });
  }

  openModal(employee?: EmployeeRecord): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.editingId = employee?.employeeId ?? null;

    this.form = employee
      ? {
          employeeName: employee.employeeName,
          emailId: employee.emailId,
          contactNo: employee.contactNo,
          deptId: employee.deptId,
          gender: employee.gender || '',
          password: '',
        }
      : emptyForm();

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveEmployee(): void {
    this.errorMessage = '';

    if (
      !this.form.employeeName.trim() ||
      !this.form.emailId.trim() ||
      (!this.editingId && this.form.password.length < 6)
    ) {
      this.errorMessage = this.editingId
        ? 'Name and email are required.'
        : 'Enter a name, email, and password with at least 6 characters.';
      return;
    }

    this.isSaving = true;

    const payload = {
      ...this.form,
      employeeName: this.form.employeeName.trim(),
      emailId: this.form.emailId.trim(),
    };

    const request = this.editingId
      ? this.employeeService.updateEmployee(this.editingId, payload)
      : this.employeeService.createEmployee(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.successMessage = this.editingId
          ? 'Employee updated.'
          : 'Employee added.';
        this.loadEmployees();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage =
          error.error?.message || 'Could not save employee.';
      },
    });
  }

  deleteEmployee(employee: EmployeeRecord): void {
    if (
      !confirm(
        `Delete ${employee.employeeName}? Their leave requests will also be deleted.`
      )
    ) {
      return;
    }

    this.employeeService.deleteEmployee(employee.employeeId).subscribe({
      next: () => {
        this.employeeList = this.employeeList.filter(
          (item) => item.employeeId !== employee.employeeId
        );
        this.successMessage = 'Employee deleted.';
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message || 'Could not delete employee.';
      },
    });
  }
}