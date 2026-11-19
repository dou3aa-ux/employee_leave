import { Component, inject, OnInit } from '@angular/core';
import { EmployeeService } from '../../services/employee';
import { APIReponseModel, EmployeeList } from '../../model/Employee.model';

@Component({
  selector: 'app-employee',
  imports: [],
  templateUrl: './employee.html',
  styleUrl: './employee.css',
})
export class Employee implements OnInit {

  employeeService = inject(EmployeeService);
  employeeList: EmployeeList[] = [];
  deptList: any[] = [];

  isModalOpen: boolean = false;

  ngOnInit(): void {
    this.getEmployees();
    this.getDepartments();
  }

  getEmployees() {
    this.employeeService.getAllEmployee().subscribe({
      next: (response: APIReponseModel) => {
        this.employeeList = response.data;
      },
      error: (err: any) => {
        console.error('Error loading employees', err);
      }
    });
  }

  getDepartments() {
    this.employeeService.getDept().subscribe({
      next: (response: any) => {
        this.deptList = response.data ? response.data : response;
      },
      error: (err: any) => {
        console.error('Error loading departments', err);
      }
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

}