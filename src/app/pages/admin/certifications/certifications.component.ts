import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminCert } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { NoticeService } from '../../../core/notice.service';
import { ModalComponent } from '../../../shared/modal.component';

@Component({
  selector: 'app-admin-certifications',
  imports: [ReactiveFormsModule, DatePipe, ModalComponent],
  template: `
    <div class="page-head"><h1>Certifications</h1><button type="button" class="btn btn-primary btn-sm" (click)="open()">+ Add certificate</button></div>

    <div class="grid grid-3">
      @for (c of rows(); track c.id) {
        <article class="card media-card" [class.off]="!c.status">
          @if (isPdf(c)) {
            <a class="pdf-tile" [href]="c.file_url" target="_blank" rel="noopener">PDF<small>Open</small></a>
          } @else {
            <img [src]="c.file_url" [alt]="c.title" loading="lazy" />
          }
          <div class="media-body">
            <strong>{{ c.title }}</strong>
            <span class="muted">{{ c.organization }}@if (c.date_received) { · {{ c.date_received | date: 'MMM y' }} }</span>
            @if (!c.status) { <span class="badge status-cancelled">HIDDEN</span> }
            <div class="row-actions">
              <button type="button" class="btn btn-ghost btn-sm" (click)="open(c)">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)">Delete</button>
            </div>
          </div>
        </article>
      } @empty { <div class="card empty">No certificates yet.</div> }
    </div>

    @if (modal()) {
      <app-modal [heading]="editing() ? 'Edit certificate' : 'Add certificate'" (closed)="modal.set(false)">
        <div [formGroup]="form" class="form-grid">
          <label class="wide">Certification name *<input type="text" formControlName="title" /></label>
          <label>Issuing organization *<input type="text" formControlName="organization" /></label>
          <label>Date received<input type="date" formControlName="date_received" /></label>
          <label class="wide">Description<textarea rows="2" formControlName="description"></textarea></label>
          <label class="wide">Certificate (image or PDF) {{ editing() ? '(leave empty to keep current)' : '*' }}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" (change)="onFile($event)" />
          </label>
          <label class="check wide"><input type="checkbox" formControlName="status" /> Show on website</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="modal.set(false)">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ saving() ? 'Uploading…' : 'Save' }}</button>
        </div>
      </app-modal>
    }
  `,
})
export class AdminCertificationsComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);

  rows = signal<AdminCert[]>([]);
  modal = signal(false);
  editing = signal<AdminCert | null>(null);
  saving = signal(false);
  file = signal<File | null>(null);

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    organization: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    date_received: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl(true, { nonNullable: true }),
  });

  constructor() { this.load(); }

  isPdf(c: AdminCert) { return c.file_url.toLowerCase().endsWith('.pdf'); }
  load() { this.api.certifications().subscribe({ next: (r) => this.rows.set(r), error: (e) => this.notice.error(errMsg(e)) }); }
  onFile(e: Event) { this.file.set((e.target as HTMLInputElement).files?.[0] ?? null); }

  open(c?: AdminCert) {
    this.editing.set(c ?? null);
    this.file.set(null);
    this.form.reset({
      title: c?.title ?? '', organization: c?.organization ?? '', date_received: c?.date_received ?? '',
      description: c?.description ?? '', status: c?.status ?? true,
    });
    this.modal.set(true);
  }

  save() {
    const e = this.editing();
    if (this.form.invalid) { this.form.markAllAsTouched(); this.notice.error('Please enter the name and issuing organization.'); return; }
    if (!e && !this.file()) { this.notice.error('Please choose the certificate file.'); return; }

    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', v.title.trim());
    fd.append('organization', v.organization.trim());
    fd.append('description', v.description.trim());
    if (v.date_received) fd.append('date_received', v.date_received);
    fd.append('status', v.status ? '1' : '0');
    const f = this.file();
    if (f) fd.append('certificate', f);

    this.saving.set(true);
    this.api.saveCertification(e?.id ?? null, fd).subscribe({
      next: () => { this.saving.set(false); this.modal.set(false); this.notice.ok('Certificate saved'); this.load(); },
      error: (err) => { this.saving.set(false); this.notice.error(errMsg(err)); },
    });
  }

  remove(c: AdminCert) {
    if (!confirm(`Delete "${c.title}"?`)) return;
    this.api.deleteCertification(c.id).subscribe({
      next: () => { this.notice.ok('Deleted'); this.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
