import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminApiService } from '../../../core/admin-api.service';
import { errMsg } from '../../../core/http-error';
import { toYmd } from '../../../core/format';
import { Booking, Slot } from '../../../core/models';
import { NoticeService } from '../../../core/notice.service';
import { BookingSummaryComponent } from '../../../shared/booking-summary.component';
import { ModalComponent } from '../../../shared/modal.component';

type Scope = 'today' | 'upcoming' | 'pending' | 'completed' | 'cancelled' | '';

@Component({
  selector: 'app-appointments',
  imports: [CurrencyPipe, DatePipe, ModalComponent, BookingSummaryComponent],
  template: `
    <div class="page-head"><h1>Appointments</h1></div>

    <div class="tabs" role="tablist">
      @for (t of tabs; track t.label) {
        <button type="button" class="chip" [class.active]="scope() === t.key" (click)="setScope(t.key)">{{ t.label }}</button>
      }
    </div>

    <div class="toolbar">
      <input type="search" placeholder="Search name, phone or reference" [value]="search()" (input)="onSearch($event)" (keydown.enter)="reload()" />
      <select (change)="onType($event)" aria-label="Booking type">
        <option value="">All types</option>
        <option value="in_store">In-store</option>
        <option value="home_service">Home service</option>
      </select>
      <button type="button" class="btn btn-ghost btn-sm" (click)="reload()">Search</button>
    </div>

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (rows().length === 0) {
      <div class="card empty">No appointments found.</div>
    } @else {
      <div class="appt-list">
        @for (b of rows(); track b.id) {
          <article class="appt card">
            <div class="appt-when"><strong>{{ b.date | date: 'EEE, MMM d' }}</strong><span>{{ b.time_label }}</span></div>
            <div class="appt-main">
              <strong>{{ b.customer.name }}</strong>
              <span class="muted">{{ b.service?.name }} · {{ b.total_price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span>
              <span class="tag">{{ b.booking_type === 'home_service' ? '🏠 Home service' : '✂ In-store' }}</span>
            </div>
            <span [class]="'badge status-' + b.status.toLowerCase()">{{ b.status }}</span>
            <div class="appt-actions">
              <button type="button" class="btn btn-ghost btn-sm" (click)="selected.set(b)">Details</button>
              @if (b.status === 'PENDING') { <button type="button" class="btn btn-primary btn-sm" (click)="confirm(b)">Confirm</button> }
              @if (b.status === 'CONFIRMED') { <button type="button" class="btn btn-primary btn-sm" (click)="complete(b)">Complete</button> }
              @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                <button type="button" class="btn btn-ghost btn-sm" (click)="openResched(b)">Reschedule</button>
                <button type="button" class="btn btn-danger btn-sm" (click)="openCancel(b)">Cancel</button>
              }
            </div>
          </article>
        }
      </div>
      <div class="pager">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">← Prev</button>
        <span class="muted">Page {{ page() }} of {{ lastPage() }} · {{ total() }} total</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= lastPage()" (click)="go(page() + 1)">Next →</button>
      </div>
    }

    @if (selected(); as b) {
      <app-modal heading="Appointment details" (closed)="selected.set(null)">
        <app-booking-summary [booking]="b" />
        <p><span class="label">Email</span><br /><a [href]="'mailto:' + b.customer.email">{{ b.customer.email }}</a></p>
        <p><span class="label">Phone</span><br /><a [href]="'tel:' + b.customer.phone">{{ b.customer.phone }}</a></p>
        @if (b.cancel_reason) { <p class="muted">Cancelled: {{ b.cancel_reason }}</p> }
      </app-modal>
    }

    @if (cancelTarget(); as b) {
      <app-modal heading="Cancel appointment" (closed)="cancelTarget.set(null)">
        <p>Cancel <strong>{{ b.customer.name }}</strong>'s booking on {{ b.date | date: 'mediumDate' }} at {{ b.time_label }}? The time slot will be freed.</p>
        <label>Reason (optional)<input type="text" [value]="reason()" (input)="onReason($event)" placeholder="e.g. Customer requested" /></label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="cancelTarget.set(null)">Keep booking</button>
          <button type="button" class="btn btn-danger" (click)="doCancel(b)">Cancel booking</button>
        </div>
      </app-modal>
    }

    @if (rsTarget(); as b) {
      <app-modal heading="Reschedule" (closed)="rsTarget.set(null)">
        <p>Move <strong>{{ b.customer.name }}</strong> ({{ b.service?.name }}) from {{ b.date | date: 'mediumDate' }}, {{ b.time_label }}.</p>
        <label>New date<input type="date" [min]="today" [value]="rsDate() ?? ''" (change)="onRsDate($event, b)" /></label>
        @if (rsDate()) {
          @if (rsLoading()) { <p class="muted">Checking availability…</p> }
          @else if (rsSlots().length === 0) { <p class="muted">No times on this date (closed, holiday or past).</p> }
          @else {
            <div class="slots">
              @for (s of rsSlots(); track s.time) {
                <button type="button" class="slot" [class.selected]="rsTime() === s.time" [class.booked]="!s.available" [disabled]="!s.available" (click)="rsTime.set(s.time)">
                  <span>{{ s.available ? '✅' : '❌' }}</span><span class="slot-time">{{ s.label }}</span><span class="slot-status">{{ s.status }}</span>
                </button>
              }
            </div>
          }
        }
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="rsTarget.set(null)">Close</button>
          <button type="button" class="btn btn-primary" [disabled]="!rsDate() || !rsTime()" (click)="doResched(b)">Move appointment</button>
        </div>
      </app-modal>
    }
  `,
})
export class AppointmentsComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);

  tabs: { key: Scope; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' }, { key: 'cancelled', label: 'Cancelled' }, { key: '', label: 'All' },
  ];
  today = toYmd(new Date());

  scope = signal<Scope>('today');
  type = signal('');
  search = signal('');
  page = signal(1);
  lastPage = signal(1);
  total = signal(0);
  rows = signal<Booking[]>([]);
  loading = signal(false);

  selected = signal<Booking | null>(null);
  cancelTarget = signal<Booking | null>(null);
  reason = signal('');
  rsTarget = signal<Booking | null>(null);
  rsDate = signal<string | null>(null);
  rsSlots = signal<Slot[]>([]);
  rsTime = signal<string | null>(null);
  rsLoading = signal(false);

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.appointments({ scope: this.scope(), type: this.type(), search: this.search().trim(), page: this.page() }).subscribe({
      next: (r) => {
        this.rows.set(r.data);
        this.lastPage.set(r.meta.last_page);
        this.total.set(r.meta.total);
        this.loading.set(false);
      },
      error: (e) => { this.loading.set(false); this.notice.error(errMsg(e)); },
    });
  }

  setScope(s: Scope) { this.scope.set(s); this.page.set(1); this.load(); }
  reload() { this.page.set(1); this.load(); }
  go(p: number) { this.page.set(p); this.load(); }
  onSearch(e: Event) { this.search.set((e.target as HTMLInputElement).value); }
  onType(e: Event) { this.type.set((e.target as HTMLSelectElement).value); this.reload(); }
  onReason(e: Event) { this.reason.set((e.target as HTMLInputElement).value); }

  private run(obs: Observable<unknown>, okText: string) {
    obs.subscribe({
      next: () => { this.notice.ok(okText); this.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  confirm(b: Booking) { this.run(this.api.confirm(b.id), `Confirmed ${b.customer.name}'s booking`); }
  complete(b: Booking) { this.run(this.api.complete(b.id), 'Marked as completed'); }

  openCancel(b: Booking) { this.reason.set(''); this.cancelTarget.set(b); }
  doCancel(b: Booking) { this.cancelTarget.set(null); this.run(this.api.cancel(b.id, this.reason().trim()), 'Booking cancelled'); }

  openResched(b: Booking) {
    this.rsDate.set(null); this.rsTime.set(null); this.rsSlots.set([]);
    this.rsTarget.set(b);
  }

  onRsDate(e: Event, b: Booking) {
    const d = (e.target as HTMLInputElement).value;
    this.rsDate.set(d || null);
    this.rsTime.set(null);
    this.rsSlots.set([]);
    if (!d || !b.barber || !b.service) return;
    this.rsLoading.set(true);
    this.api.availability(b.barber.id, b.service.id, d, b.id).subscribe({
      next: (r) => { if (this.rsDate() === d) { this.rsSlots.set(r.slots); } this.rsLoading.set(false); },
      error: (err) => { this.rsLoading.set(false); this.notice.error(errMsg(err)); },
    });
  }

  doResched(b: Booking) {
    const d = this.rsDate();
    const t = this.rsTime();
    if (!d || !t) return;
    this.rsTarget.set(null);
    this.run(this.api.reschedule(b.id, d, t), 'Appointment rescheduled');
  }
}
