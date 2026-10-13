import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { BlockedSlot, DAY_NAMES } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { Holiday } from '../../../core/models';
import { NoticeService } from '../../../core/notice.service';
import { ShopStore } from '../../../core/shop.store';

type HourGroup = FormGroup<{
  day: FormControl<number>; is_open: FormControl<boolean>;
  opening_time: FormControl<string>; closing_time: FormControl<string>;
  break_start: FormControl<string>; break_end: FormControl<string>;
}>;

const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

@Component({
  selector: 'app-schedule',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="page-head"><h1>Business schedule</h1></div>

    <section class="card">
      <h2>Opening hours</h2>
      <p class="muted small">Set the hours for each day. Leave the break empty if there isn't one. Customers can only book inside these hours.</p>
      <div class="hours-edit">
        @for (g of hoursForm.controls; track g.controls.day.value) {
          <div class="hours-row" [formGroup]="g" [class.off]="!g.controls.is_open.value">
            <label class="check day"><input type="checkbox" formControlName="is_open" /> <strong>{{ dayName(g.controls.day.value) }}</strong></label>
            @if (g.controls.is_open.value) {
              <label>Open<input type="time" formControlName="opening_time" /></label>
              <label>Close<input type="time" formControlName="closing_time" /></label>
              <label>Break from<input type="time" formControlName="break_start" /></label>
              <label>Break to<input type="time" formControlName="break_end" /></label>
            } @else { <span class="muted">Day off</span> }
          </div>
        }
      </div>
      <button type="button" class="btn btn-primary" [disabled]="savingHours()" (click)="saveHours()">{{ savingHours() ? 'Saving…' : 'Save opening hours' }}</button>
    </section>

    <section class="card">
      <h2>Booking rules</h2>
      <div [formGroup]="rules" class="form-grid three">
        <label>Appointment start interval (min)<input type="number" min="5" step="5" formControlName="slot_interval_minutes" /></label>
        <label>Buffer between appointments (min)<input type="number" min="0" step="5" formControlName="buffer_minutes" /></label>
        <label>Minimum notice (min)<input type="number" min="0" step="15" formControlName="min_notice_minutes" /></label>
        <label>Book up to (days ahead)<input type="number" min="1" formControlName="max_advance_days" /></label>
        <label>Customers can cancel up to (hours before)<input type="number" min="0" formControlName="cancellation_hours" /></label>
      </div>
      <p class="muted small">Appointment length comes from each service's duration (Services page). With a 60-minute interval, start times are 10:00, 11:00, 12:00…</p>
      <button type="button" class="btn btn-primary" [disabled]="savingRules()" (click)="saveRules()">Save booking rules</button>
    </section>

    <div class="two-col">
      <section class="card">
        <h2>Holidays / days off</h2>
        <div [formGroup]="holidayForm" class="inline-form">
          <input type="date" formControlName="date" aria-label="Date" />
          <input type="text" formControlName="name" placeholder="Name (e.g. Christmas Day)" />
          <button type="button" class="btn btn-primary btn-sm" (click)="addHoliday()">Add</button>
        </div>
        @for (h of holidays(); track h.id) {
          <div class="list-line"><span><strong>{{ h.date | date: 'mediumDate' }}</strong> · {{ h.name }}</span>
            <button type="button" class="btn btn-danger btn-sm" (click)="removeHoliday(h)">Remove</button></div>
        } @empty { <p class="muted">No holidays set.</p> }
      </section>

      <section class="card">
        <h2>Block specific dates / times</h2>
        <div [formGroup]="blockForm" class="form-grid">
          <label>Date *<input type="date" formControlName="date" /></label>
          <label>Barber
            <select formControlName="barber_id">
              <option value="">Whole shop</option>
              @for (b of shop.barbers(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
            </select>
          </label>
          <label class="check wide"><input type="checkbox" formControlName="all_day" /> Block the whole day</label>
          @if (!blockForm.controls.all_day.value) {
            <label>From<input type="time" formControlName="start_time" /></label>
            <label>To<input type="time" formControlName="end_time" /></label>
          }
          <label class="wide">Reason<input type="text" formControlName="reason" placeholder="e.g. Personal errand" /></label>
        </div>
        <button type="button" class="btn btn-primary btn-sm" (click)="addBlocked()">Block time</button>
        @for (b of blocked(); track b.id) {
          <div class="list-line">
            <span><strong>{{ b.date | date: 'mediumDate' }}</strong> · {{ b.start_time ? hm(b.start_time) + '–' + hm(b.end_time) : 'All day' }}
              @if (b.reason) { <span class="muted">· {{ b.reason }}</span> }</span>
            <button type="button" class="btn btn-danger btn-sm" (click)="removeBlocked(b)">Remove</button>
          </div>
        } @empty { <p class="muted">Nothing blocked.</p> }
      </section>
    </div>
  `,
})
export class ScheduleComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  shop = inject(ShopStore);

  hoursForm = new FormArray<HourGroup>([]);
  savingHours = signal(false);
  savingRules = signal(false);
  holidays = signal<Holiday[]>([]);
  blocked = signal<BlockedSlot[]>([]);

  rules = new FormGroup({
    slot_interval_minutes: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(5)] }),
    buffer_minutes: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    min_notice_minutes: new FormControl(60, { nonNullable: true, validators: [Validators.min(0)] }),
    max_advance_days: new FormControl(60, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    cancellation_hours: new FormControl(3, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  holidayForm = new FormGroup({
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  blockForm = new FormGroup({
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    barber_id: new FormControl('', { nonNullable: true }),
    all_day: new FormControl(true, { nonNullable: true }),
    start_time: new FormControl('', { nonNullable: true }),
    end_time: new FormControl('', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.loadHours();
    this.loadHolidays();
    this.loadBlocked();
    this.api.settings().subscribe((s) => {
      const num = (k: string, d: number) => (s[k] !== undefined && s[k] !== null && s[k] !== '' ? Number(s[k]) : d);
      this.rules.reset({
        slot_interval_minutes: num('slot_interval_minutes', 60), buffer_minutes: num('buffer_minutes', 0),
        min_notice_minutes: num('min_notice_minutes', 60), max_advance_days: num('max_advance_days', 60),
        cancellation_hours: num('cancellation_hours', 3),
      });
    });
  }

  dayName(d: number) { return DAY_NAMES[d]; }
  hm(t: string | null) { return hhmm(t); }

  loadHours() {
    this.api.hours().subscribe({
      next: (rows) => {
        this.hoursForm.clear();
        const byDay = new Map(rows.map((r) => [r.day, r]));
        for (const d of [1, 2, 3, 4, 5, 6, 0]) {
          const r = byDay.get(d);
          this.hoursForm.push(new FormGroup({
            day: new FormControl(d, { nonNullable: true }),
            is_open: new FormControl(r ? r.is_open : false, { nonNullable: true }),
            opening_time: new FormControl(hhmm(r?.opening_time) || '10:00', { nonNullable: true }),
            closing_time: new FormControl(hhmm(r?.closing_time) || '17:00', { nonNullable: true }),
            break_start: new FormControl(hhmm(r?.break_start), { nonNullable: true }),
            break_end: new FormControl(hhmm(r?.break_end), { nonNullable: true }),
          }));
        }
      },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  saveHours() {
    const payload = this.hoursForm.getRawValue().map((r) => ({
      day: r.day,
      is_open: r.is_open,
      opening_time: r.is_open ? r.opening_time || null : null,
      closing_time: r.is_open ? r.closing_time || null : null,
      break_start: r.is_open ? r.break_start || null : null,
      break_end: r.is_open ? r.break_end || null : null,
    }));
    this.savingHours.set(true);
    this.api.saveHours(payload).subscribe({
      next: () => { this.savingHours.set(false); this.notice.ok('Opening hours saved'); this.shop.load(); },
      error: (e) => { this.savingHours.set(false); this.notice.error(errMsg(e)); },
    });
  }

  saveRules() {
    if (this.rules.invalid) { this.notice.error('Please check the numbers.'); return; }
    this.savingRules.set(true);
    this.api.saveSettings(this.rules.getRawValue()).subscribe({
      next: () => { this.savingRules.set(false); this.notice.ok('Booking rules saved'); },
      error: (e) => { this.savingRules.set(false); this.notice.error(errMsg(e)); },
    });
  }

  loadHolidays() { this.api.holidays().subscribe((r) => this.holidays.set(r)); }
  loadBlocked() { this.api.blocked().subscribe((r) => this.blocked.set(r)); }

  addHoliday() {
    if (this.holidayForm.invalid) { this.notice.error('Enter a date and a name.'); return; }
    this.api.addHoliday(this.holidayForm.getRawValue()).subscribe({
      next: () => { this.notice.ok('Holiday added'); this.holidayForm.reset({ date: '', name: '' }); this.loadHolidays(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  removeHoliday(h: Holiday) {
    this.api.deleteHoliday(h.id).subscribe({
      next: () => { this.notice.ok('Holiday removed'); this.loadHolidays(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  addBlocked() {
    const v = this.blockForm.getRawValue();
    if (!v.date) { this.notice.error('Choose a date to block.'); return; }
    if (!v.all_day && (!v.start_time || !v.end_time)) { this.notice.error('Enter the start and end time, or block the whole day.'); return; }
    this.api.addBlocked({
      date: v.date,
      barber_id: v.barber_id ? Number(v.barber_id) : null,
      start_time: v.all_day ? null : v.start_time,
      end_time: v.all_day ? null : v.end_time,
      reason: v.reason.trim() || null,
    }).subscribe({
      next: () => { this.notice.ok('Time blocked'); this.blockForm.reset({ date: '', barber_id: '', all_day: true, start_time: '', end_time: '', reason: '' }); this.loadBlocked(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  removeBlocked(b: BlockedSlot) {
    this.api.deleteBlocked(b.id).subscribe({
      next: () => { this.notice.ok('Block removed'); this.loadBlocked(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
