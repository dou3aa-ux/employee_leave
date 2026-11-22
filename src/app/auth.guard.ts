import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  return typeof localStorage !== 'undefined' &&
    localStorage.getItem('leaveToken')
    ? true
    : router.parseUrl('/login');
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (
    typeof localStorage === 'undefined' ||
    !localStorage.getItem('leaveToken')
  ) {
    return router.parseUrl('/login');
  }

  try {
    const user = JSON.parse(
      localStorage.getItem('leaveUser') || '{}'
    ) as { role?: string };

    return user.role === 'Admin'
      ? true
      : router.parseUrl('/leave');
  } catch {
    return router.parseUrl('/login');
  }
};