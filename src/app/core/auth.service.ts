import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { User } from './admin.models';
import { API_URL } from './config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private key = 'freeman.token';

  token = signal<string | null>(this.read());
  user = signal<User | null>(null);
  isAdmin = computed(() => this.user()?.role === 'admin');

  login(email: string, password: string): Observable<User> {
    return this.http.post<{ user: User; token: string }>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap((r) => { this.save(r.token); this.user.set(r.user); }),
      map((r) => r.user),
    );
  }

  /** Called by the route guard on first load / refresh. */
  loadUser(): Observable<User | null> {
    if (!this.token()) return of(null);
    return this.http.get<User>(`${API_URL}/auth/me`).pipe(
      tap((u) => this.user.set(u)),
      catchError(() => { this.clear(); return of(null); }),
    );
  }

  logout() {
    this.http.post(`${API_URL}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe(() => {
      this.clear();
      this.router.navigate(['/admin/login']);
    });
  }

  clear() {
    this.token.set(null);
    this.user.set(null);
    try { localStorage.removeItem(this.key); } catch { /* ignore */ }
  }

  private save(t: string) {
    this.token.set(t);
    try { localStorage.setItem(this.key, t); } catch { /* ignore */ }
  }

  private read(): string | null {
    try { return localStorage.getItem(this.key); } catch { return null; }
  }
}
