import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminArea } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { Booking } from '../../../core/models';
import { NoticeService } from '../../../core/notice.service';
import { ShopStore } from '../../../core/shop.store';

@Component({
  selector: 'app-home-service-admin',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head"><h1>Home service</h1></div>

    <section class="card">
      <h2>Settings</h2>
      <div [formGroup]="settings" class="form-grid">
        <label class="check wide"><input type="checkbox" formControlName="enabled" /> Accept home service bookings</label>
        <label>Home service fee (₱)<input type="number" min="0" step="10" formControlName="fee" /></label>
      </div>
      <p class="muted small">Example: Haircut ₱150 + home service fee ₱100 = ₱250 total. The fee is added automatically at booking.</p>
      <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="saveSettings()">{{ saving() ? 'Saving…' : 'Save settings' }}</button>
    </section>

    <section class="card">
      <h2>Service areas</h2>
      <p class="muted small">Optional. If you add areas, customers must choose one when booking home service. Each area can add an extra fee.</p>
      <div [formGroup]="areaForm" class="inline-form">
        <input type="text" formControlName="name" placeholder="Area / barangay name" />
        <input type="number" min="0" formControlName="extra_fee" placeholder="Extra fee (₱)" />
        <button type="button" class="btn btn-primary btn-sm" (click)="addArea()">Add area</button>
      </div>
      @for (a of areas(); track a.id) {
        <div class="list-line" [class.off]="!a.status">
          <span><strong>{{ a.name }}</strong> <span class="muted">· extra {{ a.extra_fee | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span>
            @if (!a.status) { <span class="badge status-cancelled">OFF</span> }</span>
          <span class="row-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="toggleArea(a)">{{ a.status ? 'Disable' : 'Enable' }}</button>
            <button type="button" class="btn btn-danger btn-sm" (click)="removeArea(a)">Delete</button>
          </span>
        </div>
      } @empty { <p class="muted">No areas set. Customers can enter any address.</p> }
    </section>

    <section>
      <h2>Upcoming home-service bookings</h2>
      @for (b of bookings(); track b.id) {
        <article class="appt card compact">
          <div class="appt-when"><strong>{{ b.date | date: 'EEE, MMM d' }}</strong><span>{{ b.time_label }}</span></div>
          <div class="appt-main"><strong>{{ b.customer.name }}</strong><span class="muted">{{ b.service?.name }} · {{ b.customer.phone }}</span>
            <span>📍 {{ b.location }} @if (b.landmark) { <span class="muted">({{ b.landmark }})</span> }</span></div>
          <span [class]="'badge status-' + b.status.toLowerCase()">{{ b.status }}</span>
        </article>
      } @empty { <p class="muted">No upcoming home-service bookings.</p> }
    </section>
  `,
})
export class HomeServiceAdminComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  private shop = inject(ShopStore);

  areas = signal<AdminArea[]>([]);
  bookings = signal<Booking[]>([]);
  saving = signal(false);

  settings = new FormGroup({
    enabled: new FormControl(false, { nonNullable: true }),
    fee: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  areaForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    extra_fee: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  constructor() {
    this.load();
    this.api.appointments({ type: 'home_service', scope: 'upcoming', per_page: 50 }).subscribe((r) => this.bookings.set(r.data));
  }

  load() {
    this.api.homeService().subscribe({
      next: (d) => { this.settings.reset({ enabled: d.enabled, fee: d.fee }); this.areas.set(d.areas); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  saveSettings() {
    const v = this.settings.getRawValue();
    this.saving.set(true);
    this.api.saveSettings({ home_service_enabled: v.enabled, home_service_fee: v.fee }).subscribe({
      next: () => { this.saving.set(false); this.notice.ok('Home service settings saved'); this.shop.load(); },
      error: (e) => { this.saving.set(false); this.notice.error(errMsg(e)); },
    });
  }

  addArea() {
    if (this.areaForm.invalid) { this.notice.error('Enter the area name.'); return; }
    this.api.createArea(this.areaForm.getRawValue()).subscribe({
      next: () => { this.notice.ok('Area added'); this.areaForm.reset({ name: '', extra_fee: 0 }); this.load(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  toggleArea(a: AdminArea) {
    this.api.updateArea(a.id, { status: !a.status }).subscribe({
      next: () => { this.load(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  removeArea(a: AdminArea) {
    if (!confirm(`Delete area "${a.name}"?`)) return;
    this.api.deleteArea(a.id).subscribe({
      next: () => { this.notice.ok('Area deleted'); this.load(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
