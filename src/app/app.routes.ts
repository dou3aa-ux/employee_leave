import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { Employee } from './pages/employee/employee';
import { Layout } from './pages/layout/layout';
import { Leave } from './pages/leave/leave';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, canActivate: [adminGuard] },
      { path: 'employee', component: Employee, canActivate: [adminGuard] },
      { path: 'leave', component: Leave },
    ],
  },
];