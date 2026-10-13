import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { NoticeService } from '../../../core/notice.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin">
      <aside class="admin-side" [class.open]="open()">
        <a routerLink="/admin" class="admin-brand" (click)="open.set(false)">
          <img src="images/logo-brown.png" width="40" height="40" alt="" /><span>Freeman Admin</span>
        </a>
        <nav aria-label="Admin">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: l.exact }" (click)="open.set(false)">
              <span aria-hidden="true">{{ l.icon }}</span> {{ l.label }}
            </a>
          }
        </nav>
        <div class="admin-side-foot">
          <a routerLink="/" target="_blank">View website ↗</a>
          <button type="button" (click)="auth.logout()">Log out</button>
        </div>
      </aside>

      <div class="admin-main">
        <header class="admin-top">
          <button type="button" class="icon-btn menu-a" (click)="open.set(!open())" aria-label="Menu">☰</button>
          <span class="muted">Signed in as <strong>{{ auth.user()?.name }}</strong></span>
        </header>
        <div class="admin-content"><router-outlet /></div>
      </div>

      @if (notice.notice(); as n) {
        <div class="toast" [class.error]="n.type === 'error'" role="status">{{ n.text }}</div>
      }
    </div>
  `,
})
export class AdminShellComponent {
  auth = inject(AuthService);
  notice = inject(NoticeService);
  open = signal(false);

  links = [
    { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/admin/appointments', label: 'Appointments', icon: '📋', exact: false },
    { path: '/admin/calendar', label: 'Calendar', icon: '📅', exact: false },
    { path: '/admin/services', label: 'Services', icon: '✂', exact: false },
    { path: '/admin/portfolio', label: 'Portfolio', icon: '🖼', exact: false },
    { path: '/admin/certifications', label: 'Certifications', icon: '🎓', exact: false },
    { path: '/admin/schedule', label: 'Business schedule', icon: '🕒', exact: false },
    { path: '/admin/home-service', label: 'Home service', icon: '🏠', exact: false },
    { path: '/admin/settings', label: 'Settings', icon: '⚙', exact: false },
  ];
}
