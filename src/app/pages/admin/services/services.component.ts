import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminService } from '../../../core/admin.models';
import { DurationPipe } from '../../../core/duration.pipe';
import { errMsg } from '../../../core/http-error';
import { NoticeService } from '../../../core/notice.service';
import { ShopStore } from '../../../core/shop.store';
import { ModalComponent } from '../../../shared/modal.component';

@Component({
  selector: 'app-admin-services',
  imports: [ReactiveFormsModule, CurrencyPipe, DurationPipe, ModalComponent],
  template: `
    <div class="page-head"><h1>Services &amp; pricing</h1><button type="button" class="btn btn-primary btn-sm" (click)="open()">+ Add service</button></div>

    <div class="list">
      @for (s of rows(); track s.id) {
        <article class="card row-card" [class.off]="!s.status">
          <div class="grow">
            <strong>{{ s.name }}</strong> @if (!s.status) { <span class="badge status-cancelled">DISABLED</span> }
            <p class="muted">{{ s.description }}</p>
            <span class="muted">⏱ {{ s.duration | duration }}</span>
          </div>
          <span class="price">{{ s.price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span>
          <div class="row-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="toggle(s)">{{ s.status ? 'Disable' : 'Enable' }}</button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="open(s)">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" (click)="remove(s)">Delete</button>
          </div>
        </article>
      } @empty { <div class="card empty">No services yet. Add your first one.</div> }
    </div>

    @if (modal()) {
      <app-modal [heading]="editing() ? 'Edit service' : 'Add service'" (closed)="modal.set(false)">
        <div [formGroup]="form" class="form-grid">
          <label class="wide">Service name *<input type="text" formControlName="name" /></label>
          <label class="wide">Description<textarea rows="2" formControlName="description"></textarea></label>
          <label>Price (₱) *<input type="number" min="0" step="1" formControlName="price" /></label>
          <label>Duration (minutes) *<input type="number" min="5" step="5" formControlName="duration" /></label>
          <label>Display order<input type="number" min="0" formControlName="sort_order" /></label>
          <label class="check"><input type="checkbox" formControlName="status" /> Show on website &amp; allow booking</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="modal.set(false)">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ saving() ? 'Saving…' : 'Save service' }}</button>
        </div>
      </app-modal>
    }
  `,
})
export class AdminServicesComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  private shop = inject(ShopStore);

  rows = signal<AdminService[]>([]);
  modal = signal(false);
  editing = signal<AdminService | null>(null);
  saving = signal(false);

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    description: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    duration: new FormControl<number | null>(60, [Validators.required, Validators.min(5)]),
    sort_order: new FormControl(0, { nonNullable: true }),
    status: new FormControl(true, { nonNullable: true }),
  });

  constructor() { this.load(); }

  load() { this.api.services().subscribe({ next: (r) => this.rows.set(r), error: (e) => this.notice.error(errMsg(e)) }); }

  open(s?: AdminService) {
    this.editing.set(s ?? null);
    this.form.reset({
      name: s?.name ?? '', description: s?.description ?? '', price: s ? Number(s.price) : null,
      duration: s?.duration ?? 60, sort_order: s?.sort_order ?? this.rows().length, status: s?.status ?? true,
    });
    this.modal.set(true);
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.notice.error('Please fill in the name, price and duration.'); return; }
    const body = this.form.getRawValue();
    const e = this.editing();
    this.saving.set(true);
    (e ? this.api.updateService(e.id, body) : this.api.createService(body)).subscribe({
      next: () => { this.saving.set(false); this.modal.set(false); this.notice.ok('Service saved'); this.load(); this.shop.load(); },
      error: (err) => { this.saving.set(false); this.notice.error(errMsg(err)); },
    });
  }

  toggle(s: AdminService) {
    this.api.updateService(s.id, { status: !s.status }).subscribe({
      next: () => { this.notice.ok(s.status ? 'Service disabled' : 'Service enabled'); this.load(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }

  remove(s: AdminService) {
    if (!confirm(`Delete "${s.name}"? Services with booking history are disabled instead.`)) return;
    this.api.deleteService(s.id).subscribe({
      next: (r) => { this.notice.ok(r?.message ?? 'Service deleted'); this.load(); this.shop.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
