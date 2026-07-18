import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';

export const authGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(() => true),
    catchError(() => {
      void router.navigateByUrl('/login');
      return of(false);
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(() => {
      void router.navigateByUrl('/');
      return false;
    }),
    catchError(() => of(true)),
  );
};
