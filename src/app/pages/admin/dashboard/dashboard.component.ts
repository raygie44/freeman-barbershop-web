import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminStats } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { Booking } from '../../../core/models';
import { NoticeService } from '../../../core/notice.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, NgTemplateOutlet],
  template: `
    <div class="page-head"><h1>Dashboard</h1><a routerLink="/admin/appointments" class="btn btn-primary btn-sm">All appointments</a></div>

    @if (stats(); as s) {
      <div class="stat-grid">
        <div class="stat card"><span>Today</span><strong>{{ s.today }}</strong></div>
        <div class="stat card warn"><span>Pending</span><strong>{{ s.pending }}</strong></div>
        <div class="stat card"><span>Upcoming</span><strong>{{ s.upcoming }}</strong></div>
        <div class="stat card"><span>Home service (upcoming)</span><strong>{{ s.home_service_upcoming }}</strong></div>
        <div class="stat card"><span>Completed this month</span><strong>{{ s.completed_this_month }}</strong></div>
        <div class="stat card"><span>Revenue this month</span><strong>{{ s.revenue_this_month | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></div>
      </div>
    }

    <div class="two-col">
      <section>
        <h2>Today's appointments</h2>
        @for (b of today(); track b.id) { <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: b }" /> }
        @empty { <p class="muted">Nothing scheduled for today.</p> }
      </section>
      <section>
        <h2>Waiting for confirmation</h2>
        @for (b of pending(); track b.id) { <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: b }" /> }
        @empty { <p class="muted">No pending bookings. 🎉</p> }
      </section>
    </div>

    <ng-template #row let-b>
      <article class="appt card compact">
        <div class="appt-when"><strong>{{ b.date | date: 'EEE, MMM d' }}</strong><span>{{ b.time_label }}</span></div>
        <div class="appt-main">
          <strong>{{ b.customer.name }}</strong>
          <span class="muted">{{ b.service?.name }} · {{ b.booking_type === 'home_service' ? '🏠 Home' : '✂ Shop' }}</span>
        </div>
        <span [class]="'badge status-' + b.status.toLowerCase()">{{ b.status }}</span>
        @if (b.status === 'PENDING') {
          <button type="button" class="btn btn-primary btn-sm" (click)="confirm(b)">Confirm</button>
        }
      </article>
    </ng-template>
  `,
})
export class DashboardComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  stats = signal<AdminStats | null>(null);
  today = signal<Booking[]>([]);
  pending = signal<Booking[]>([]);

  constructor() { this.load(); }

  load() {
    this.api.stats().subscribe({ next: (s) => this.stats.set(s), error: (e) => this.notice.error(errMsg(e)) });
    this.api.appointments({ scope: 'today', per_page: 50 }).subscribe((r) => this.today.set(r.data));
    this.api.appointments({ scope: 'pending', per_page: 10 }).subscribe((r) => this.pending.set(r.data));
  }

  confirm(b: Booking) {
    this.api.confirm(b.id).subscribe({
      next: () => { this.notice.ok(`Confirmed ${b.customer.name}'s booking`); this.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
