import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../core/shop.store';
import { SITE } from '../../core/site-content';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">About the barber</p>
        <h1>{{ site.barberName }}</h1>
        <p class="lead">{{ site.barberTitle }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container about-grid">
        <div class="about-photo">
          @if (photo()) {
            <img [src]="photo()" [alt]="site.barberName" />
          } @else {
            <div class="photo-placeholder"><img src="images/logo-brown.png" alt="" /><small>Profile photo coming soon</small></div>
          }
        </div>
        <div>
          <h2>Hi, I'm {{ site.barberName }}</h2>
          @for (p of site.story; track $index) { <p class="lead-sm">{{ p }}</p> }

          <ul class="stat-row">
            <li><strong>{{ shop.settings().established }}</strong><span>Established</span></li>
            @if (site.yearsExperience) { <li><strong>{{ site.yearsExperience }}</strong><span>Years of experience</span></li> }
            @if (shop.homeServiceEnabled()) { <li><strong>Home</strong><span>Service available</span></li> }
          </ul>

          <h3>Skills</h3>
          <ul class="chips">@for (s of site.skills; track s) { <li>{{ s }}</li> }</ul>

          @if (site.achievements.length) {
            <h3>Achievements</h3>
            <ul class="check-list">@for (a of site.achievements; track a) { <li>{{ a }}</li> }</ul>
          }

          <div class="hero-actions">
            <a routerLink="/book" class="btn btn-primary">Book with {{ firstName }}</a>
            <a routerLink="/certifications" class="btn btn-ghost">View certifications</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  shop = inject(ShopStore);
  site = SITE;
  firstName = SITE.barberName.split(' ')[0];
  photo = computed(() => this.shop.barbers()[0]?.profile_image_url ?? null);
}
