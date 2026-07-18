import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/feed/feed.component').then((m) => m.FeedComponent),
  },
  {
    path: 'calendario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/calendar/calendar.component').then(
        (m) => m.CalendarComponent,
      ),
  },
  {
    path: 'profilo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
