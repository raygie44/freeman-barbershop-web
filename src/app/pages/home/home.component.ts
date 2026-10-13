import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { DurationPipe } from '../../core/duration.pipe';
import { PortfolioItem } from '../../core/models';
import { ShopStore } from '../../core/shop.store';
import { SITE } from '../../core/site-content';
import { ContactCardComponent } from '../../shared/contact-card.component';
import { LightboxComponent } from '../../shared/lightbox.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe, DurationPipe, ContactCardComponent, LightboxComponent],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Estd {{ shop.settings().established }} · {{ shop.settings().tagline }}</p>
          <h1>Sharp cuts.<br /><span class="script">Modern &amp; classic.</span></h1>
          <p class="lead">{{ site.intro }}</p>
          <div class="hero-actions">
            <a routerLink="/book" class="btn btn-primary btn-lg">Book an Appointment</a>
            @if (shop.homeServiceEnabled()) {
              <a routerLink="/book" [queryParams]="{ type: 'home' }" class="btn btn-ghost btn-lg">Home Service</a>
            }
          </div>
          <ul class="hero-facts">
            <li>Online booking</li>
            <li>Real-time available times</li>
            @if (shop.homeServiceEnabled()) { <li>We come to you</li> }
          </ul>
        </div>
        <div class="hero-art">
          <img src="images/logo-brown.png" alt="Freeman Barbershop logo" width="420" height="420" />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <p class="eyebrow">What we do</p>
        <h2>Featured services</h2>
        <div class="grid grid-3">
          @for (s of featuredServices(); track s.id) {
            <article class="card service-card">
              <h3>{{ s.name }}</h3>
              <p class="muted">{{ s.description }}</p>
              <div class="service-meta">
                <span class="price">{{ s.price | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</span>
                <span class="muted">{{ s.duration | duration }}</span>
              </div>
              <a routerLink="/book" [queryParams]="{ service: s.id }" class="btn btn-primary btn-sm">Book Now</a>
            </article>
          } @empty {
            <p class="muted">Services are loading…</p>
          }
        </div>
        <p class="center"><a routerLink="/services" class="link">See all services &amp; pricing →</a></p>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <p class="eyebrow">Our work</p>
        <h2>Featured haircut styles</h2>
        <div class="grid grid-3 gallery">
          @for (p of featured(); track p.id) {
            <button type="button" class="tile" (click)="selected.set(p)" [attr.aria-label]="'View ' + p.title">
              <img [src]="p.image_url" [alt]="p.title" loading="lazy" />
              <span class="tile-caption"><strong>{{ p.title }}</strong><small>{{ p.category_label }}</small></span>
            </button>
          } @empty {
            @for (n of placeholders; track n) {
              <div class="tile placeholder"><span>✂</span><small>Photos coming soon</small></div>
            }
          }
        </div>
        <p class="center"><a routerLink="/portfolio" class="link">View full portfolio →</a></p>
      </div>
    </section>

    @if (site.testimonials.length) {
      <section class="section">
        <div class="container">
          <p class="eyebrow">Kind words</p>
          <h2>What customers say</h2>
          <div class="grid grid-3">
            @for (t of site.testimonials; track t.name) {
              <figure class="card quote">
                <blockquote>“{{ t.text }}”</blockquote>
                <figcaption><strong>{{ t.name }}</strong>@if (t.service) { <small> · {{ t.service }}</small> }</figcaption>
              </figure>
            }
          </div>
        </div>
      </section>
    }

    <section class="cta">
      <div class="container cta-inner">
        <div>
          <h2>Ready for a fresh cut?</h2>
          <p class="lead">Pick a service, choose a time, done. It takes less than a minute.</p>
        </div>
        <a routerLink="/book" class="btn btn-primary btn-lg">Book Now</a>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <p class="eyebrow">Find us</p>
        <h2>Visit the shop</h2>
        <app-contact-card />
      </div>
    </section>

    @if (selected(); as p) {
      <app-lightbox [src]="p.image_url" [caption]="p.title + ' · ' + p.category_label" (closed)="selected.set(null)" />
    }
  `,
})
export class HomeComponent {
  private api = inject(ApiService);
  shop = inject(ShopStore);
  site = SITE;
  placeholders = [1, 2, 3];
  selected = signal<PortfolioItem | null>(null);

  featuredServices = computed(() => this.shop.services().slice(0, 3));
  private portfolio = toSignal(
    this.api.portfolio().pipe(map((r) => r.items.slice(0, 6)), catchError(() => of([] as PortfolioItem[]))),
    { initialValue: [] as PortfolioItem[] },
  );
  featured = computed(() => this.portfolio());
}
