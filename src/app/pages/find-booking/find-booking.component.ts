import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Booking } from '../../core/models';
import { ShopStore } from '../../core/shop.store';
import { BookingSummaryComponent } from '../../shared/booking-summary.component';

@Component({
  selector: 'app-find-booking',
  imports: [ReactiveFormsModule, RouterLink, BookingSummaryComponent],
  template: `
    <section class="page-hero small">
      <div class="container">
        <p class="eyebrow">Guest lookup</p>
        <h1>Find my booking</h1>
        <p class="lead">Enter the reference number from your confirmation and the phone number you booked with.</p>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        <div [formGroup]="form" class="card form-grid">
          <label class="wide">Booking reference
            <input type="text" formControlName="reference" placeholder="FRM-261012-ABCDE" autocapitalize="characters" />
          </label>
          <label class="wide">Phone number
            <input type="tel" formControlName="phone" placeholder="09XX XXX XXXX" />
          </label>
          <div class="wide">
            <button type="button" class="btn btn-primary" (click)="search()" [disabled]="loading()">{{ loading() ? 'Searching…' : 'Find booking' }}</button>
          </div>
        </div>

        @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }

        @if (booking(); as b) {
          <app-booking-summary [booking]="b" />
          <p class="muted small">
            To change or cancel, please call <a [href]="'tel:' + shop.phoneDigits()">{{ shop.settings().phone }}</a>.
          </p>
        }
        <p class="center"><a routerLink="/book" class="link">Make a new booking →</a></p>
      </div>
    </section>
  `,
})
export class FindBookingComponent {
  private api = inject(ApiService);
  shop = inject(ShopStore);
  booking = signal<Booking | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  form = new FormGroup({
    reference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  search() {
    this.error.set(null);
    this.booking.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please enter both your reference number and phone number.');
      return;
    }
    const { reference, phone } = this.form.getRawValue();
    this.loading.set(true);
    this.api.lookupBooking(reference.trim(), phone.trim()).subscribe({
      next: (r) => { this.booking.set(r.data); this.loading.set(false); },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(e.status === 404 ? (e.error?.message ?? 'Booking not found.') : 'Something went wrong. Please try again.');
      },
    });
  }
}
