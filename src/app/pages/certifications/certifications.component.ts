import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Certification } from '../../core/models';
import { LightboxComponent } from '../../shared/lightbox.component';

@Component({
  selector: 'app-certifications',
  imports: [RouterLink, DatePipe, LightboxComponent],
  template: `
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Trained &amp; certified</p>
        <h1>Certifications &amp; achievements</h1>
        <p class="lead">Skills that are proven, not just promised.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        @if (!loaded()) {
          <p class="muted">Loading certifications…</p>
        } @else if (items().length === 0) {
          <div class="empty card"><p>Certificates will be displayed here soon.</p></div>
        } @else {
          <div class="grid grid-3">
            @for (c of items(); track c.id) {
              <article class="card cert">
                @if (c.is_pdf) {
                  <a class="cert-img pdf" [href]="c.file_url" target="_blank" rel="noopener"><span>PDF</span><small>Open certificate</small></a>
                } @else {
                  <button type="button" class="cert-img" (click)="selected.set(c)" [attr.aria-label]="'View ' + c.title">
                    <img [src]="c.file_url" [alt]="c.title" loading="lazy" />
                  </button>
                }
                <h3>{{ c.title }}</h3>
                <p class="muted"><strong>{{ c.organization }}</strong>@if (c.date_received) { · {{ c.date_received | date: 'MMMM y' }} }</p>
                @if (c.description) { <p>{{ c.description }}</p> }
              </article>
            }
          </div>
        }
        <p class="center"><a routerLink="/book" class="btn btn-primary">Book an appointment</a></p>
      </div>
    </section>

    @if (selected(); as c) {
      <app-lightbox [src]="c.file_url" [caption]="c.title + ' · ' + c.organization" (closed)="selected.set(null)" />
    }
  `,
})
export class CertificationsComponent {
  private api = inject(ApiService);
  selected = signal<Certification | null>(null);
  private data = toSignal(this.api.certifications().pipe(catchError(() => of(null))));
  loaded = computed(() => this.data() !== undefined);
  items = computed(() => this.data() ?? []);
}
