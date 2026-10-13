import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../core/shop.store';
import { ContactCardComponent } from '../../shared/contact-card.component';

@Component({
  selector: 'app-contact',
  imports: [RouterLink, ContactCardComponent],
  template: `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Get in touch</p>
        <h1>Contact &amp; location</h1>
        <p class="lead">Drop by, call, or message us. Booking online is the fastest way to lock in a time.</p>
      </div>
    </section>

    <section class="section">
      <div class="container two-col">
        <app-contact-card />
        <div class="card map-card">
          <div class="map-art"><span>📍</span></div>
          <h3>{{ shop.settings().shop_name }}</h3>
          <p>{{ shop.settings().address }}</p>
          <a [href]="shop.mapsUrl()" target="_blank" rel="noopener" class="btn btn-ghost">Open in Google Maps</a>
          <a routerLink="/book" class="btn btn-primary">Book Now</a>
          @if (shop.homeServiceEnabled()) { <p class="muted small">Home service is available. Choose it when you book.</p> }
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  shop = inject(ShopStore);
}
