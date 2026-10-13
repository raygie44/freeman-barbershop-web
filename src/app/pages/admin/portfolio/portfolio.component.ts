import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminPortfolio, PORTFOLIO_CATEGORIES } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { NoticeService } from '../../../core/notice.service';
import { ModalComponent } from '../../../shared/modal.component';

@Component({
  selector: 'app-admin-portfolio',
  imports: [ReactiveFormsModule, DatePipe, ModalComponent],
  template: `
    <div class="page-head"><h1>Haircut portfolio</h1><button type="button" class="btn btn-primary btn-sm" (click)="open()">+ Upload photo</button></div>

    <div class="grid grid-3 gallery">
      @for (p of rows(); track p.id) {
        <article class="card media-card" [class.off]="!p.status">
          <img [src]="p.image_url" [alt]="p.title" loading="lazy" />
          <div class="media-body">
            <strong>{{ p.title }}</strong>
            <span class="muted">{{ label(p.category) }}@if (p.date) { · {{ p.date | date: 'mediumDate' }} }</span>
            @if (!p.status) { <span class="badge status-cancelled">HIDDEN</span> }
            <div class="row-actions">
              <button type="button" class="btn btn-ghost btn-sm" (click)="open(p)">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)">Delete</button>
            </div>
          </div>
        </article>
      } @empty { <div class="card empty">No photos yet. Upload your first haircut.</div> }
    </div>

    @if (modal()) {
      <app-modal [heading]="editing() ? 'Edit photo' : 'Upload photo'" (closed)="modal.set(false)">
        <div [formGroup]="form" class="form-grid">
          <label class="wide">Haircut name *<input type="text" formControlName="title" placeholder="e.g. Mid Skin Fade" /></label>
          <label>Category *
            <select formControlName="category">
              @for (c of categories; track c[0]) { <option [value]="c[0]">{{ c[1] }}</option> }
            </select>
          </label>
          <label>Date<input type="date" formControlName="date" /></label>
          <label class="wide">Description<textarea rows="2" formControlName="description"></textarea></label>
          <label class="wide">Photo {{ editing() ? '(leave empty to keep current)' : '*' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)" />
          </label>
          @if (editing(); as e) { <img class="preview" [src]="e.image_url" alt="Current photo" /> }
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
export class AdminPortfolioComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);

  categories = PORTFOLIO_CATEGORIES;
  rows = signal<AdminPortfolio[]>([]);
  modal = signal(false);
  editing = signal<AdminPortfolio | null>(null);
  saving = signal(false);
  file = signal<File | null>(null);

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    category: new FormControl('low-fade', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl(true, { nonNullable: true }),
  });

  constructor() { this.load(); }

  label(key: string) { return this.categories.find((c) => c[0] === key)?.[1] ?? key; }
  load() { this.api.portfolio().subscribe({ next: (r) => this.rows.set(r), error: (e) => this.notice.error(errMsg(e)) }); }
  onFile(e: Event) { this.file.set((e.target as HTMLInputElement).files?.[0] ?? null); }

  open(p?: AdminPortfolio) {
    this.editing.set(p ?? null);
    this.file.set(null);
    this.form.reset({
      title: p?.title ?? '', category: p?.category ?? 'low-fade', date: p?.date ?? '',
      description: p?.description ?? '', status: p?.status ?? true,
    });
    this.modal.set(true);
  }

  save() {
    const e = this.editing();
    if (this.form.invalid) { this.form.markAllAsTouched(); this.notice.error('Please enter a name and category.'); return; }
    if (!e && !this.file()) { this.notice.error('Please choose a photo to upload.'); return; }

    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', v.title.trim());
    fd.append('category', v.category);
    fd.append('description', v.description.trim());
    if (v.date) fd.append('date', v.date);
    fd.append('status', v.status ? '1' : '0');
    const f = this.file();
    if (f) fd.append('image', f);

    this.saving.set(true);
    this.api.savePortfolio(e?.id ?? null, fd).subscribe({
      next: () => { this.saving.set(false); this.modal.set(false); this.notice.ok('Portfolio saved'); this.load(); },
      error: (err) => { this.saving.set(false); this.notice.error(errMsg(err)); },
    });
  }

  remove(p: AdminPortfolio) {
    if (!confirm(`Delete "${p.title}"? This also deletes the photo.`)) return;
    this.api.deletePortfolio(p.id).subscribe({
      next: () => { this.notice.ok('Deleted'); this.load(); },
      error: (e) => this.notice.error(errMsg(e)),
    });
  }
}
