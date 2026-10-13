import { Injectable, signal } from '@angular/core';
import { Booking } from './models';

/** Remembers the latest booking so the confirmation page survives a refresh. */
@Injectable({ providedIn: 'root' })
export class BookingStore {
  private key = 'freeman.lastBooking';
  last = signal<Booking | null>(this.read());

  set(b: Booking) {
    this.last.set(b);
    try { sessionStorage.setItem(this.key, JSON.stringify(b)); } catch { /* storage unavailable */ }
  }

  private read(): Booking | null {
    try {
      const raw = sessionStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as Booking) : null;
    } catch {
      return null;
    }
  }
}
