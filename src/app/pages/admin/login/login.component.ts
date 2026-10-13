import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { errMsg } from '../../../core/http-error';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-wrap">
      <div class="card login-card">
        <img src="images/logo-brown.png" alt="Freeman Barbershop" width="110" height="110" />
        <h1>Admin login</h1>
        <div [formGroup]="form" class="form-grid">
          <label class="wide">Email
            <input type="email" formControlName="email" autocomplete="username" (keydown.enter)="submit()" />
          </label>
          <label class="wide">Password
            <input type="password" formControlName="password" autocomplete="current-password" (keydown.enter)="submit()" />
          </label>
        </div>
        @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }
        <button type="button" class="btn btn-primary btn-lg login-btn" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>
        <p class="center"><a routerLink="/" class="link">← Back to website</a></p>
      </div>
    </div>
  `,
})
export class AdminLoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit() {
    this.error.set(null);
    if (this.form.invalid) { this.error.set('Enter your email and password.'); return; }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.login(email.trim(), password).subscribe({
      next: (u) => {
        this.loading.set(false);
        if (u.role !== 'admin') {
          this.auth.clear();
          this.error.set('This account does not have admin access.');
          return;
        }
        this.router.navigate(['/admin']);
      },
      error: (e) => { this.loading.set(false); this.error.set(errMsg(e)); },
    });
  }
}
