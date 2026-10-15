import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';

import { TerminalService } from '../config/terminal.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const terminalService = inject(TerminalService);
  const router = inject(Router);
  const token = authService.getToken();
  const terminalId = terminalService.getTerminalId();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (terminalId) {
    headers['X-Terminal-Id'] = terminalId;
  }

  const authenticatedRequest =
    Object.keys(headers).length > 0
      ? request.clone({
          setHeaders: headers,
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/api/v1/auth/login')) {
        authService.logout();

        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
