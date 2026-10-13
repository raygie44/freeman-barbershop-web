import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import {
  ApiSettings, Barber, BusinessHour, Booking, BookingRequest, Certification, Holiday,
  PortfolioResponse, Service, ServiceArea, Slot,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  settings() { return this.http.get<ApiSettings>(`${API_URL}/public/settings`); }
  services() { return this.http.get<Service[]>(`${API_URL}/public/services`); }
  barbers() { return this.http.get<Barber[]>(`${API_URL}/public/barbers`); }
  hours() { return this.http.get<{ hours: BusinessHour[]; holidays: Holiday[] }>(`${API_URL}/public/hours`); }
  serviceAreas() { return this.http.get<ServiceArea[]>(`${API_URL}/public/service-areas`); }
  portfolio() { return this.http.get<PortfolioResponse>(`${API_URL}/public/portfolio`); }
  certifications() { return this.http.get<Certification[]>(`${API_URL}/public/certifications`); }

  availability(barberId: number, serviceId: number, date: string) {
    return this.http.get<{ date: string; slots: Slot[] }>(`${API_URL}/availability`, {
      params: { barber_id: barberId, service_id: serviceId, date },
    });
  }

  createBooking(body: BookingRequest) {
    return this.http.post<{ data: Booking }>(`${API_URL}/bookings`, body);
  }

  lookupBooking(reference: string, phone: string) {
    return this.http.get<{ data: Booking }>(`${API_URL}/bookings/lookup`, { params: { reference, phone } });
  }
}
