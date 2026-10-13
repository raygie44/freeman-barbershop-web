import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Booking } from '../core/models';
import { DurationPipe } from '../core/duration.pipe';

@Component({
  selector: 'app-booking-summary',
  imports: [CurrencyPipe, DatePipe, DurationPipe],
  template: `
    @let b = booking();
    <div class="card booking-summary">
      <div class="ref-row">
        <div>
          <span class="label">Booking reference</span>
          <div class="ref">{{ b.reference }}</div>
        </div>
        <span class="badge" [class]="'badge status-' + b.status.toLowerCase()">{{ b.status }}</span>
      </div>
      <dl class="details">
        <div><dt>Customer</dt><dd>{{ b.customer.name }}<small>{{ b.customer.phone }}</small></dd></div>
        <div><dt>Service</dt><dd>{{ b.service?.name }}<small>{{ b.service?.duration | duration }}</small></dd></div>
        <div><dt>Barber</dt><dd>{{ b.barber?.name }}</dd></div>
        <div><dt>Date</dt><dd>{{ b.date | date: 'fullDate' }}</dd></div>
        <div><dt>Time</dt><dd>{{ b.time_label }}</dd></div>
        <div>
          <dt>Location</dt>
          <dd>
            {{ b.booking_type === 'home_service' ? 'Home Service' : 'In-store' }}
            <small>{{ b.location }}</small>
            @if (b.landmark) { <small>Landmark: {{ b.landmark }}</small> }
          </dd>
        </div>
        @if (b.notes) { <div><dt>Notes</dt><dd>{{ b.notes }}</dd></div> }
      </dl>
      <div class="price-rows">
        <div><span>{{ b.service?.name }}</span><span>{{ b.service_price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span></div>
        @if (b.home_service_fee > 0) {
          <div><span>Home service fee</span><span>{{ b.home_service_fee | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span></div>
        }
        <div class="total"><span>Total</span><span>{{ b.total_price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span></div>
      </div>
    </div>
  `,
})
export class BookingSummaryComponent {
  booking = input.required<Booking>();
}
