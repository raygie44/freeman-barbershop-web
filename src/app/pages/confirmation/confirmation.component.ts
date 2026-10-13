import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingStore } from '../../core/booking.store';
import { ShopStore } from '../../core/shop.store';
import { BookingSummaryComponent } from '../../shared/booking-summary.component';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink, BookingSummaryComponent],
  template: `
    <section class="page-hero small">
      <div class="container">
        <p class="eyebrow">All set</p>
        <h1>Booking received</h1>
      </div>
    </section>

    <section class="section">
      <div class="container narrow">
        @if (store.last(); as b) {
          <div class="alert alert-ok">
            Thank you, {{ b.customer.name }}! Your appointment request has been submitted and is
            <strong>{{ b.status }}</strong>. Please save your reference number.
          </div>
          <app-booking-summary [booking]="b" />
          <p class="muted small">
            Need to change or cancel? Call <a [href]="'tel:' + shop.phoneDigits()">{{ shop.settings().phone }}</a>,
            or look up your booking anytime on the <a routerLink="/find-booking">Find my booking</a> page.
          </p>
          <div class="hero-actions">
            <a routerLink="/" class="btn btn-ghost">Back to home</a>
            <a routerLink="/book" class="btn btn-primary">Book another</a>
          </div>
        } @else {
          <div class="card empty">
            <p>We couldn't find a recent booking in this browser.</p>
            <div class="hero-actions">
              <a routerLink="/find-booking" class="btn btn-ghost">Find my booking</a>
              <a routerLink="/book" class="btn btn-primary">Book an appointment</a>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class ConfirmationComponent {
  store = inject(BookingStore);
  shop = inject(ShopStore);
}
