import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DurationPipe } from '../../core/duration.pipe';
import { ShopStore } from '../../core/shop.store';

@Component({
  selector: 'app-services',
  imports: [RouterLink, CurrencyPipe, DurationPipe],
  template: `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Menu</p>
        <h1>Services &amp; pricing</h1>
        <p class="lead">Clear prices, no surprises.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="service-list">
          @for (s of shop.services(); track s.id) {
            <article class="card service-row">
              <div class="service-info">
                <h3>{{ s.name }}</h3>
                <p class="muted">{{ s.description }}</p>
                <span class="muted">⏱ {{ s.duration | duration }}</span>
              </div>
              <div class="service-action">
                <span class="price">{{ s.price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span>
                <a routerLink="/book" [queryParams]="{ service: s.id }" class="btn btn-primary btn-sm">Book Now</a>
              </div>
            </article>
          } @empty {
            <p class="muted">{{ shop.loaded() ? 'No services available right now.' : 'Loading services…' }}</p>
          }
        </div>

        @if (shop.homeServiceEnabled()) {
          <div class="card note">
            <h3>Home service</h3>
            <p>Prefer a haircut at home? Add <strong>{{ shop.homeServiceFee() | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong>
               to any service and we'll come to you.</p>
            <a routerLink="/book" [queryParams]="{ type: 'home' }" class="btn btn-ghost btn-sm">Book home service</a>
          </div>
        }
      </div>
    </section>
  `,
})
export class ServicesComponent {
  shop = inject(ShopStore);
}
