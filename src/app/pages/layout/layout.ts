import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private router = inject(Router);

  user =
    typeof localStorage !== 'undefined'
      ? (JSON.parse(localStorage.getItem('leaveUser') || '{}') as {
          name?: string;
          role?: string;
        })
      : {};

  onLogout(): void {
    localStorage.removeItem('leaveToken');
    localStorage.removeItem('leaveUser');
    this.router.navigateByUrl('/login');
  }
}