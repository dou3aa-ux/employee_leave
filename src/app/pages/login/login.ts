import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginModel } from '../../model/Employee.model';
import { EmployeeService } from '../../services/employee';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginObj = new LoginModel();
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  errorMessage = '';
  isLoading = false;

  onLogin(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.employeeService
      .login(this.loginObj.emailId, this.loginObj.password)
      .subscribe({
        next: (session) => {
          localStorage.setItem('leaveToken', session.token);
          localStorage.setItem('leaveUser', JSON.stringify(session.user));

          this.router.navigateByUrl(
            session.user.role === 'Admin' ? '/dashboard' : '/leave'
          );
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Unable to sign in. Please try again.';
          this.isLoading = false;
        },
      });
  }
}