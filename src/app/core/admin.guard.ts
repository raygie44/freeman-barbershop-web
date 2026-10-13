import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const login = router.createUrlTree(['/admin/login']);

  if (auth.user()) return auth.isAdmin() ? true : login;
  return auth.loadUser().pipe(map((u) => (u?.role === 'admin' ? true : login)));
};
