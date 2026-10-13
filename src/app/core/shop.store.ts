import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { fmtTime, toYmd } from './format';
import { BusinessHour, Barber, Holiday, SETTING_KEYS, Service, ServiceArea, Settings } from './models';
import { DEFAULT_SETTINGS, SITE } from './site-content';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A social link only counts if it has a path (not just 'https://facebook.com/'). */
const hasPath = (u: string) => /^https?:\/\/[^/]+\/.+/.test(u);

/** Shop-wide data loaded once at startup and shared by every page. */
@Injectable({ providedIn: 'root' })
export class ShopStore {
  private api = inject(ApiService);

  settings = signal<Settings>({ ...DEFAULT_SETTINGS });
  hours = signal<BusinessHour[]>([]);
  holidays = signal<Holiday[]>([]);
  services = signal<Service[]>([]);
  barbers = signal<Barber[]>([]);
  areas = signal<ServiceArea[]>([]);
  loaded = signal(false);
  error = signal(false);

  homeServiceEnabled = computed(() => ['1', 'true'].includes(this.settings().home_service_enabled));
  homeServiceFee = computed(() => Number(this.settings().home_service_fee) || 0);
  phoneDigits = computed(() => this.settings().phone.replace(/[^\d+]/g, ''));

  facebookUrl = computed(() => (hasPath(this.settings().facebook) ? this.settings().facebook : SITE.facebookFallback));
  instagramUrl = computed(() => (hasPath(this.settings().instagram) ? this.settings().instagram : SITE.instagramFallback));
  tiktokUrl = computed(() => (hasPath(this.settings().tiktok) ? this.settings().tiktok : ''));
  mapsUrl = computed(
    () => this.settings().maps_url ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.settings().address)}`,
  );

  /** Monday-first rows for the business hours table. */
  hoursRows = computed(() => {
    const byDay = new Map(this.hours().map((h) => [h.day, h]));
    return [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const h = byDay.get(d);
      const open = !!h && h.is_open && !!h.opening_time && !!h.closing_time;
      return {
        day: DAY_NAMES[d],
        open,
        text: h && open && h.opening_time && h.closing_time ? `${fmtTime(h.opening_time)} – ${fmtTime(h.closing_time)}` : 'Closed',
        breakText: h && h.break_start && h.break_end ? `Break ${fmtTime(h.break_start)} – ${fmtTime(h.break_end)}` : '',
      };
    });
  });

  isOpenOn(date: Date): boolean {
    const h = this.hours().find((x) => x.day === date.getDay());
    if (!h || !h.is_open) return false;
    const ymd = toYmd(date);
    return !this.holidays().some((x) => x.date === ymd);
  }

  load() {
    forkJoin({
      settings: this.api.settings(),
      hours: this.api.hours(),
      services: this.api.services(),
      barbers: this.api.barbers(),
      areas: this.api.serviceAreas(),
    }).subscribe({
      next: (r) => {
        const merged: Settings = { ...DEFAULT_SETTINGS };
        for (const k of SETTING_KEYS) {
          const v = r.settings[k];
          if (v !== null && v !== undefined && v !== '') merged[k] = String(v);
        }
        this.settings.set(merged);
        this.hours.set(r.hours.hours);
        this.holidays.set(r.hours.holidays);
        this.services.set(r.services);
        this.barbers.set(r.barbers);
        this.areas.set(r.areas);
        this.loaded.set(true);
      },
      error: () => {
        this.error.set(true);
        this.loaded.set(true);
      },
    });
  }
}
