import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingStore } from '../../core/booking.store';
import { DurationPipe } from '../../core/duration.pipe';
import { toYmd } from '../../core/format';
import { BookingRequest, BookingType, ServiceArea, Slot } from '../../core/models';
import { ShopStore } from '../../core/shop.store';

type StepName = 'service' | 'barber' | 'datetime' | 'details' | 'review';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABELS: Record<StepName, string> = { service: 'Service', barber: 'Barber', datetime: 'Date & time', details: 'Your details', review: 'Review' };

@Component({
  selector: 'app-book',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, DurationPipe],
  templateUrl: './book.component.html',
})
export class BookComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bookings = inject(BookingStore);
  shop = inject(ShopStore);

  // --- wizard state ---
  step = signal(1);
  serviceId = signal<number | null>(null);
  barberChoice = signal<number | null>(null);
  date = signal<string | null>(null);
  time = signal<string | null>(null);
  timeLabel = signal('');
  typeChoice = signal<BookingType>('in_store');
  areaId = signal<number | null>(null);
  slots = signal<Slot[]>([]);
  loadingSlots = signal(false);
  submitting = signal(false);
  submitted = signal(false);
  error = signal<string | null>(null);
  addressMissing = signal(false);
  areaMissing = signal(false);

  form = new FormGroup({
    customer_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    customer_phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)] }),
    customer_email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    address: new FormControl('', { nonNullable: true }),
    landmark: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  // --- derived ---
  steps = computed<StepName[]>(() =>
    this.shop.barbers().length > 1
      ? ['service', 'barber', 'datetime', 'details', 'review']
      : ['service', 'datetime', 'details', 'review'],
  );
  current = computed<StepName>(() => this.steps()[this.step() - 1]);
  stepLabel = (s: StepName) => LABELS[s];

  barberId = computed(() => this.barberChoice() ?? (this.shop.barbers().length === 1 ? this.shop.barbers()[0].id : null));
  selectedService = computed(() => this.shop.services().find((s) => s.id === this.serviceId()));
  selectedBarber = computed(() => this.shop.barbers().find((b) => b.id === this.barberId()));
  selectedArea = computed(() => this.shop.areas().find((a) => a.id === this.areaId()));

  type = computed<BookingType>(() => (this.typeChoice() === 'home_service' && this.shop.homeServiceEnabled() ? 'home_service' : 'in_store'));
  fee = computed(() => (this.type() === 'home_service' ? this.shop.homeServiceFee() + Number(this.selectedArea()?.extra_fee ?? 0) : 0));
  total = computed(() => Number(this.selectedService()?.price ?? 0) + this.fee());

  /** Next 28 days; closed days and holidays are disabled. */
  days = computed(() => {
    const out: { ymd: string; dow: string; day: number; month: string; open: boolean }[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push({ ymd: toYmd(d), dow: WEEKDAYS[d.getDay()], day: d.getDate(), month: MONTHS[d.getMonth()], open: this.shop.isOpenOn(d) });
    }
    return out;
  });

  constructor() {
    const qp = this.route.snapshot.queryParamMap;
    const svc = Number(qp.get('service'));
    if (svc) this.serviceId.set(svc);
    if (qp.get('type') === 'home') this.typeChoice.set('home_service');
  }

  // --- actions ---
  pickService(id: number) {
    this.serviceId.set(id);
    this.time.set(null); // slot lengths depend on the service
    this.slots.set([]);
  }

  pickBarber(id: number) {
    this.barberChoice.set(id);
    this.time.set(null);
    this.slots.set([]);
  }

  pickDate(ymd: string) {
    this.date.set(ymd);
    this.time.set(null);
    this.loadSlots();
  }

  pickTime(s: Slot) {
    if (!s.available) return;
    this.time.set(s.time);
    this.timeLabel.set(s.label);
  }

  areaLabel(a: ServiceArea): string {
    const fee = Number(a.extra_fee) || 0;
    return fee > 0 ? `${a.name} (+₱${fee})` : a.name;
  }

  setArea(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.areaId.set(v ? Number(v) : null);
  }

  loadSlots() {
    const b = this.barberId();
    const s = this.serviceId();
    const d = this.date();
    if (!b || !s || !d) return;
    this.loadingSlots.set(true);
    this.slots.set([]);
    this.api.availability(b, s, d).subscribe({
      next: (r) => {
        if (this.date() !== d) return; // a newer date was picked meanwhile
        this.slots.set(r.slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.loadingSlots.set(false);
        this.error.set('Could not load available times. Please try again.');
      },
    });
  }

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted());
  }

  next() {
    this.error.set(null);
    switch (this.current()) {
      case 'service':
        if (!this.selectedService()) return this.error.set('Please choose a service.');
        break;
      case 'barber':
        if (!this.barberId()) return this.error.set('Please choose a barber.');
        break;
      case 'datetime':
        if (!this.date() || !this.time()) return this.error.set('Please choose a date and an available time.');
        break;
      case 'details': {
        this.submitted.set(true);
        this.form.markAllAsTouched();
        const home = this.type() === 'home_service';
        this.addressMissing.set(home && !this.form.controls.address.value.trim());
        this.areaMissing.set(home && this.shop.areas().length > 0 && !this.areaId());
        if (this.form.invalid || this.addressMissing() || this.areaMissing()) return this.error.set('Please fix the highlighted fields.');
        break;
      }
    }
    this.go(this.step() + 1);
  }

  back() {
    this.error.set(null);
    this.go(this.step() - 1);
  }

  goStep(name: StepName) {
    const i = this.steps().indexOf(name);
    if (i >= 0) this.go(i + 1);
  }

  private go(n: number) {
    this.step.set(Math.max(1, Math.min(n, this.steps().length)));
    if (this.current() === 'datetime' && this.date()) this.loadSlots(); // refresh: slots may have changed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirm() {
    const svc = this.selectedService();
    const barber = this.barberId();
    const date = this.date();
    const time = this.time();
    if (!svc || !barber || !date || !time) return;

    const f = this.form.getRawValue();
    const home = this.type() === 'home_service';
    const payload: BookingRequest = {
      service_id: svc.id,
      barber_id: barber,
      date,
      time,
      booking_type: this.type(),
      customer_name: f.customer_name.trim(),
      customer_phone: f.customer_phone.trim(),
      customer_email: f.customer_email.trim(),
      notes: f.notes.trim(),
      ...(home ? { address: f.address.trim(), landmark: f.landmark.trim(), service_area_id: this.areaId() } : {}),
    };

    this.error.set(null);
    this.submitting.set(true);
    this.api.createBooking(payload).subscribe({
      next: (r) => {
        this.bookings.set(r.data);
        this.router.navigate(['/confirmation']);
      },
      error: (e: HttpErrorResponse) => {
        this.submitting.set(false);
        if (e.status === 409) {
          // Someone else took the slot a moment ago: send the customer back to pick another time.
          this.error.set(e.error?.message ?? 'That time was just taken. Please choose another.');
          this.time.set(null);
          this.goStep('datetime');
        } else if (e.status === 422 && e.error?.errors) {
          const first = Object.values(e.error.errors as Record<string, string[]>)[0];
          this.error.set(first?.[0] ?? 'Please check your details.');
          this.goStep('details');
        } else {
          this.error.set('Something went wrong. Please try again, or call the shop.');
        }
      },
    });
  }
}
