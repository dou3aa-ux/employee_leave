import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APIReponseModel } from '../model/Employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {

  constructor(private http: HttpClient) {}

  // Login
  onLogin(obj: any): Observable<APIReponseModel> {
    return this.http.post<APIReponseModel>(
      "https://projectapi.gerasim.in/api/EmployeeLeave/Login",
      obj
    );
  }

  // Get All Employees
  getAllEmployee(): Observable<APIReponseModel> {
    return this.http.get<APIReponseModel>(
      "https://projectapi.gerasim.in/api/EmployeeLeave/GetEmployees"
    );
  }

  // Get Departments
  getDept(): Observable<APIReponseModel> {
    return this.http.get<APIReponseModel>(
      "https://projectapi.gerasim.in/api/EmployeeLeave/GetDepartments"
    );
  }

}