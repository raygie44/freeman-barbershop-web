import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AdminArea, AdminBarber, AdminCert, AdminPortfolio, AdminService, AdminSettings, AdminStats,
  BlockedSlot, CalendarData, HomeServiceData, Paginated,
} from './admin.models';
import { API_URL } from './config';
import { Booking, BusinessHour, Holiday, Slot } from './models';

type Q = Record<string, string | number | null | undefined>;
const A = `${API_URL}/admin`;

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);

  private params(o: Q) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    return p;
  }

  // dashboard + calendar
  stats() { return this.http.get<AdminStats>(`${A}/stats`); }
  calendar(from: string, to: string) { return this.http.get<CalendarData>(`${A}/calendar`, { params: { from, to } }); }

  // appointments
  appointments(q: Q) { return this.http.get<Paginated<Booking>>(`${A}/appointments`, { params: this.params(q) }); }
  confirm(id: number) { return this.http.post<{ data: Booking }>(`${A}/appointments/${id}/confirm`, {}); }
  complete(id: number) { return this.http.post<{ data: Booking }>(`${A}/appointments/${id}/complete`, {}); }
  cancel(id: number, reason: string) { return this.http.post<{ data: Booking }>(`${A}/appointments/${id}/cancel`, { reason }); }
  reschedule(id: number, date: string, time: string) { return this.http.post<{ data: Booking }>(`${A}/appointments/${id}/reschedule`, { date, time }); }
  availability(barberId: number, serviceId: number, date: string, ignoreId: number) {
    return this.http.get<{ date: string; slots: Slot[] }>(`${A}/availability`, {
      params: { barber_id: barberId, service_id: serviceId, date, ignore_appointment_id: ignoreId },
    });
  }

  // services
  services() { return this.http.get<AdminService[]>(`${A}/services`); }
  createService(b: object) { return this.http.post<AdminService>(`${A}/services`, b); }
  updateService(id: number, b: object) { return this.http.put<AdminService>(`${A}/services/${id}`, b); }
  deleteService(id: number) { return this.http.delete<{ message?: string } | null>(`${A}/services/${id}`); }

  // barbers (multipart: POST + _method=PUT when editing)
  barbers() { return this.http.get<AdminBarber[]>(`${A}/barbers`); }
  saveBarber(id: number | null, fd: FormData) { return this.multipart(`${A}/barbers`, id, fd); }

  // portfolio
  portfolio() { return this.http.get<AdminPortfolio[]>(`${A}/portfolio`); }
  savePortfolio(id: number | null, fd: FormData) { return this.multipart(`${A}/portfolio`, id, fd); }
  deletePortfolio(id: number) { return this.http.delete(`${A}/portfolio/${id}`); }

  // certifications
  certifications() { return this.http.get<AdminCert[]>(`${A}/certifications`); }
  saveCertification(id: number | null, fd: FormData) { return this.multipart(`${A}/certifications`, id, fd); }
  deleteCertification(id: number) { return this.http.delete(`${A}/certifications/${id}`); }

  // schedule
  hours() { return this.http.get<BusinessHour[]>(`${A}/schedule/hours`); }
  saveHours(hours: object[]) { return this.http.put<BusinessHour[]>(`${A}/schedule/hours`, { hours }); }
  holidays() { return this.http.get<Holiday[]>(`${A}/schedule/holidays`); }
  addHoliday(b: { date: string; name: string }) { return this.http.post<Holiday>(`${A}/schedule/holidays`, b); }
  deleteHoliday(id: number) { return this.http.delete(`${A}/schedule/holidays/${id}`); }
  blocked() { return this.http.get<BlockedSlot[]>(`${A}/schedule/blocked`); }
  addBlocked(b: object) { return this.http.post<BlockedSlot>(`${A}/schedule/blocked`, b); }
  deleteBlocked(id: number) { return this.http.delete(`${A}/schedule/blocked/${id}`); }

  // settings + home service
  settings() { return this.http.get<AdminSettings>(`${A}/settings`); }
  saveSettings(b: Record<string, string | number | boolean | null>) { return this.http.put<AdminSettings>(`${A}/settings`, b); }
  homeService() { return this.http.get<HomeServiceData>(`${A}/home-service`); }
  createArea(b: object) { return this.http.post<AdminArea>(`${A}/service-areas`, b); }
  updateArea(id: number, b: object) { return this.http.put<AdminArea>(`${A}/service-areas/${id}`, b); }
  deleteArea(id: number) { return this.http.delete(`${A}/service-areas/${id}`); }

  private multipart(base: string, id: number | null, fd: FormData) {
    if (id === null) return this.http.post<unknown>(base, fd);
    fd.append('_method', 'PUT'); // Laravel can't read multipart on a real PUT
    return this.http.post<unknown>(`${base}/${id}`, fd);
  }
}
