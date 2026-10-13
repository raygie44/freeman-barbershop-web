import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { PortfolioItem } from '../../core/models';
import { LightboxComponent } from '../../shared/lightbox.component';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink, DatePipe, LightboxComponent],
  template: `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Our work</p>
        <h1>Haircut portfolio</h1>
        <p class="lead">Real cuts from the chair. Tap a photo to see it larger.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="chips filter" role="tablist" aria-label="Filter by category">
          <button type="button" class="chip" [class.active]="category() === ''" (click)="category.set('')">All</button>
          @for (c of categories(); track c[0]) {
            <button type="button" class="chip" [class.active]="category() === c[0]" (click)="category.set(c[0])">{{ c[1] }}</button>
          }
        </div>

        @if (!loaded()) {
          <p class="muted">Loading portfolio…</p>
        } @else if (items().length === 0) {
          <div class="empty card">
            <p>{{ category() ? 'No photos in this category yet.' : 'Photos are coming soon.' }}</p>
            <a routerLink="/book" class="btn btn-primary btn-sm">Book an appointment</a>
          </div>
        } @else {
          <div class="grid grid-3 gallery">
            @for (p of items(); track p.id) {
              <button type="button" class="tile" (click)="selected.set(p)" [attr.aria-label]="'View ' + p.title">
                <img [src]="p.image_url" [alt]="p.title" loading="lazy" />
                <span class="tile-caption">
                  <strong>{{ p.title }}</strong>
                  <small>{{ p.category_label }}@if (p.date) { · {{ p.date | date: 'mediumDate' }} }</small>
                </span>
              </button>
            }
          </div>
        }
      </div>
    </section>

    @if (selected(); as p) {
      <app-lightbox [src]="p.image_url" [caption]="p.title + ' · ' + p.category_label + (p.description ? ' — ' + p.description : '')"
                    (closed)="selected.set(null)" />
    }
  `,
})
export class PortfolioComponent {
  private api = inject(ApiService);
  category = signal('');
  selected = signal<PortfolioItem | null>(null);

  private data = toSignal(this.api.portfolio().pipe(catchError(() => of(null))));
  loaded = computed(() => this.data() !== undefined);
  categories = computed(() => Object.entries(this.data()?.categories ?? {}));
  items = computed(() => {
    const all = this.data()?.items ?? [];
    const c = this.category();
    return c ? all.filter((i) => i.category === c) : all;
  });
}
