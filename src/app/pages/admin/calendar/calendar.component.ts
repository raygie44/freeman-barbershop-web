import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/admin-api.service';
import { CalendarAppt, CalendarData } from '../../../core/admin.models';
import { toYmd } from '../../../core/format';
import { errMsg } from '../../../core/http-error';
import { NoticeService } from '../../../core/notice.service';
import { ShopStore } from '../../../core/shop.store';

interface Cell {
  ymd: string; day: number; inMonth: boolean; isToday: boolean;
  open: boolean; holiday: boolean; blockedAll: boolean; blockedPart: boolean;
  booked: number; completed: number; cancelled: number; available: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page-head">
      <h1>Calendar</h1>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-sm" (click)="shift(-1)" aria-label="Previous month">←</button>
        <strong>{{ month() | date: 'MMMM y' }}</strong>
        <button type="button" class="btn btn-ghost btn-sm" (click)="shift(1)" aria-label="Next month">→</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="goToday()">Today</button>
      </div>
    </div>

    <ul class="legend">
      <li><i class="dot avail"></i>Available</li>
      <li><i class="dot booked"></i>Booked</li>
      <li><i class="dot done"></i>Completed</li>
      <li><i class="dot cancel"></i>Cancelled</li>
      <li><i class="dot closed"></i>Closed / holiday / blocked</li>
    </ul>

    <div class="cal">
      @for (w of weekdays; track w) { <div class="cal-head">{{ w }}</div> }
      @for (c of cells(); track c.ymd) {
        <button type="button" class="cal-cell" [class.out]="!c.inMonth" [class.today]="c.isToday" [class.sel]="selected() === c.ymd"
                [class.closed]="!c.open || c.holiday || c.blockedAll" (click)="selected.set(c.ymd)">
          <span class="num">{{ c.day }}</span>
          @if (c.holiday) { <small class="cal-note">Holiday</small> }
          @else if (c.blockedAll) { <small class="cal-note">Blocked</small> }
          @else if (!c.open) { <small class="cal-note">Closed</small> }
          @else {
            @if (c.booked) { <span class="pill booked">{{ c.booked }} booked</span> }
            @if (c.completed) { <span class="pill done">{{ c.completed }} done</span> }
            @if (c.cancelled) { <span class="pill cancel">{{ c.cancelled }} cancelled</span> }
            @if (c.available) { <span class="pill avail">Available</span> }
            @if (c.blockedPart) { <small class="cal-note">Partly blocked</small> }
          }
        </button>
      }
    </div>

    @if (selected(); as d) {
      <section class="card day-panel">
        <h2>{{ d | date: 'fullDate' }}</h2>
        @for (a of dayAppts(); track a.id) {
          <div class="day-row">
            <strong>{{ a.start }} – {{ a.end }}</strong>
            <span>{{ a.customer }} <span class="muted">· {{ a.service }} · {{ a.type === 'home_service' ? '🏠' : '✂' }}</span></span>
            <span [class]="'badge status-' + a.status">{{ a.status.toUpperCase() }}</span>
          </div>
        } @empty { <p class="muted">No appointments on this day.</p> }
        <a routerLink="/admin/appointments" class="link">Manage appointments →</a>
      </section>
    }
  `,
})
export class CalendarComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  private shop = inject(ShopStore);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  month = signal(this.firstOfMonth(new Date()));
  selected = signal<string | null>(toYmd(new Date()));
  data = signal<CalendarData | null>(null);

  cells = computed<Cell[]>(() => {
    const m = this.month();
    const start = new Date(m.getFullYear(), m.getMonth(), 1);
    start.setDate(1 - start.getDay());
    const d = this.data();
    const apps = d?.appointments ?? [];
    const holidays = new Set((d?.holidays ?? []).map((h) => h.date));
    const blocked = d?.blocked ?? [];
    const todayYmd = toYmd(new Date());
    const out: Cell[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const ymd = toYmd(date);
      const day = apps.filter((a) => a.date === ymd);
      const active = day.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
      const open = this.shop.hours().find((h) => h.day === date.getDay())?.is_open ?? false;
      const holiday = holidays.has(ymd);
      const blockedAll = blocked.some((b) => b.date === ymd && !b.start_time);
      out.push({
        ymd, day: date.getDate(), inMonth: date.getMonth() === m.getMonth(), isToday: ymd === todayYmd,
        open, holiday, blockedAll, blockedPart: blocked.some((b) => b.date === ymd && !!b.start_time),
        booked: active,
        completed: day.filter((a) => a.status === 'completed').length,
        cancelled: day.filter((a) => a.status === 'cancelled').length,
        available: open && !holiday && !blockedAll && ymd >= todayYmd && active === 0,
      });
    }
    return out;
  });

  dayAppts = computed<CalendarAppt[]>(() =>
    (this.data()?.appointments ?? []).filter((a) => a.date === this.selected()).sort((a, b) => a.start.localeCompare(b.start)),
  );

  constructor() { this.load(); }

  private firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }

  shift(n: number) {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + n, 1));
    this.load();
  }

  goToday() {
    this.month.set(this.firstOfMonth(new Date()));
    this.selected.set(toYmd(new Date()));
    this.load();
  }

  load() {
    const cells = this.cells();
    const from = cells[0].ymd;
    const to = cells[cells.length - 1].ymd;
    this.api.calendar(from, to).subscribe({
      next: (r) => this.data.set(r),
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
