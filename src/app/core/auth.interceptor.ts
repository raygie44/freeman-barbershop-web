import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './config';

/** Adds the login token to API calls; sends the admin back to login if it has expired. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const isApi = req.url.startsWith(API_URL);

  if (token && isApi) req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401 && isApi && !req.url.includes('/auth/login') && auth.token()) {
        auth.clear();
        router.navigate(['/admin/login']);
      }
      return throwError(() => e);
    }),
  );
};
