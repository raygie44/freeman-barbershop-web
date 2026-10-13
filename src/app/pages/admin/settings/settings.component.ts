import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/admin-api.service';
import { AdminBarber } from '../../../core/admin.models';
import { errMsg } from '../../../core/http-error';
import { NoticeService } from '../../../core/notice.service';
import { ShopStore } from '../../../core/shop.store';
import { ModalComponent } from '../../../shared/modal.component';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <div class="page-head"><h1>Settings</h1></div>

    <section class="card">
      <h2>Shop information</h2>
      <p class="muted small">Shown on the website's footer, home page and contact page.</p>
      <div [formGroup]="form" class="form-grid">
        <label>Shop name *<input type="text" formControlName="shop_name" /></label>
        <label>Tagline<input type="text" formControlName="tagline" /></label>
        <label>Year established<input type="text" formControlName="established" /></label>
        <label>Phone *<input type="text" formControlName="phone" /></label>
        <label class="wide">Address *<input type="text" formControlName="address" /></label>
        <label>Email<input type="email" formControlName="email" /></label>
        <label>Facebook page link<input type="url" formControlName="facebook" placeholder="https://facebook.com/yourpage" /></label>
        <label>Instagram link<input type="url" formControlName="instagram" placeholder="https://instagram.com/yourname" /></label>
        <label>TikTok link<input type="url" formControlName="tiktok" placeholder="https://tiktok.com/@yourname" /></label>
        <label class="wide">Google Maps link<input type="url" formControlName="maps_url" placeholder="Paste the Share link from Google Maps" /></label>
      </div>
      <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">{{ saving() ? 'Saving…' : 'Save settings' }}</button>
    </section>

    <section class="card">
      <div class="page-head tight"><h2>Barbers</h2><button type="button" class="btn btn-ghost btn-sm" (click)="openBarber()">+ Add barber</button></div>
      @for (b of barbers(); track b.id) {
        <div class="list-line" [class.off]="!b.status">
          <span class="barber-line">
            @if (b.profile_image_url) { <img [src]="b.profile_image_url" alt="" class="avatar" /> } @else { <span class="avatar ph">✂</span> }
            <span><strong>{{ b.name }}</strong><br /><span class="muted small">{{ b.description }}</span></span>
          </span>
          <button type="button" class="btn btn-ghost btn-sm" (click)="openBarber(b)">Edit</button>
        </div>
      }
    </section>

    @if (barberModal()) {
      <app-modal [heading]="editing() ? 'Edit barber' : 'Add barber'" (closed)="barberModal.set(false)">
        <div [formGroup]="barberForm" class="form-grid">
          <label class="wide">Name *<input type="text" formControlName="name" /></label>
          <label class="wide">About / description<textarea rows="3" formControlName="description"></textarea></label>
          <label class="wide">Profile photo <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onPhoto($event)" /></label>
          <label class="check wide"><input type="checkbox" formControlName="status" /> Accepting bookings</label>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" (click)="barberModal.set(false)">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="savingBarber()" (click)="saveBarber()">{{ savingBarber() ? 'Saving…' : 'Save barber' }}</button>
        </div>
      </app-modal>
    }
  `,
})
export class SettingsComponent {
  private api = inject(AdminApiService);
  private notice = inject(NoticeService);
  private shop = inject(ShopStore);

  saving = signal(false);
  barbers = signal<AdminBarber[]>([]);
  barberModal = signal(false);
  editing = signal<AdminBarber | null>(null);
  savingBarber = signal(false);
  photo = signal<File | null>(null);

  form = new FormGroup({
    shop_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tagline: new FormControl('', { nonNullable: true }),
    established: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    facebook: new FormControl('', { nonNullable: true }),
    instagram: new FormControl('', { nonNullable: true }),
    tiktok: new FormControl('', { nonNullable: true }),
    maps_url: new FormControl('', { nonNullable: true }),
  });

  barberForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    status: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    this.api.settings().subscribe({
      next: (s) => {
        this.form.reset({
          shop_name: s['shop_name'] ?? '', tagline: s['tagline'] ?? '', established: s['established'] ?? '',
          address: s['address'] ?? '', phone: s['phone'] ?? '', email: s['email'] ?? '',
          facebook: s['facebook'] ?? '', instagram: s['instagram'] ?? '', tiktok: s['tiktok'] ?? '', maps_url: s['maps_url'] ?? '',
        });
      },
      error: (e) => this.notice.error(errMsg(e)),
    });
    this.loadBarbers();
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.notice.error('Please fill in the shop name, phone and address (and use a valid email).'); return; }
    this.saving.set(true);
    this.api.saveSettings(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.notice.ok('Settings saved'); this.shop.load(); },
      error: (e) => { this.saving.set(false); this.notice.error(errMsg(e)); },
    });
  }

  loadBarbers() { this.api.barbers().subscribe((r) => this.barbers.set(r)); }
  onPhoto(e: Event) { this.photo.set((e.target as HTMLInputElement).files?.[0] ?? null); }

  openBarber(b?: AdminBarber) {
    this.editing.set(b ?? null);
    this.photo.set(null);
    this.barberForm.reset({ name: b?.name ?? '', description: b?.description ?? '', status: b?.status ?? true });
    this.barberModal.set(true);
  }

  saveBarber() {
    if (this.barberForm.invalid) { this.notice.error('Please enter the barber name.'); return; }
    const v = this.barberForm.getRawValue();
    const fd = new FormData();
    fd.append('name', v.name.trim());
    fd.append('description', v.description.trim());
    fd.append('status', v.status ? '1' : '0');
    const f = this.photo();
    if (f) fd.append('photo', f);

    this.savingBarber.set(true);
    this.api.saveBarber(this.editing()?.id ?? null, fd).subscribe({
      next: () => { this.savingBarber.set(false); this.barberModal.set(false); this.notice.ok('Barber saved'); this.loadBarbers(); this.shop.load(); },
      error: (e) => { this.savingBarber.set(false); this.notice.error(errMsg(e)); },
    });
  }
}
