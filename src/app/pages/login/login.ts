import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginModel } from '../../model/Employee.model';
import { EmployeeService } from '../../services/employee';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginObj: LoginModel = new LoginModel();

  employeeService = inject(EmployeeService)  
  router =inject(Router)

  onLogin() {
  if (this.loginObj.emailId === 'hradmin@gmail.com' && this.loginObj.password === '112233') {
    alert("Login Success");
    localStorage.setItem('leaveUser', JSON.stringify({
      emailId: this.loginObj.emailId,
      role: 'Admin'
    }));
    this.router.navigateByUrl("/dashboard");
  } else {
    alert("Wrong Credentials");
  }
}
}
