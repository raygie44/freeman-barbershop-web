import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

const SHOP = 'Freeman Barbershop';

export const routes: Routes = [
  { path: '', title: `${SHOP} | Modern & Classic`, loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'about', title: `About | ${SHOP}`, loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent) },
  { path: 'services', title: `Services & Pricing | ${SHOP}`, loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent) },
  { path: 'portfolio', title: `Haircut Portfolio | ${SHOP}`, loadComponent: () => import('./pages/portfolio/portfolio.component').then((m) => m.PortfolioComponent) },
  { path: 'certifications', title: `Certifications | ${SHOP}`, loadComponent: () => import('./pages/certifications/certifications.component').then((m) => m.CertificationsComponent) },
  { path: 'contact', title: `Contact | ${SHOP}`, loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent) },
  { path: 'book', title: `Book an Appointment | ${SHOP}`, loadComponent: () => import('./pages/book/book.component').then((m) => m.BookComponent) },
  { path: 'confirmation', title: `Booking Confirmation | ${SHOP}`, loadComponent: () => import('./pages/confirmation/confirmation.component').then((m) => m.ConfirmationComponent) },
  { path: 'find-booking', title: `Find My Booking | ${SHOP}`, loadComponent: () => import('./pages/find-booking/find-booking.component').then((m) => m.FindBookingComponent) },
  {
    path: 'admin/login',
    title: `Admin Login | ${SHOP}`,
    loadComponent: () => import('./pages/admin/login/login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/shell/shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', title: `Dashboard | Admin`, loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'appointments', title: `Appointments | Admin`, loadComponent: () => import('./pages/admin/appointments/appointments.component').then((m) => m.AppointmentsComponent) },
      { path: 'calendar', title: `Calendar | Admin`, loadComponent: () => import('./pages/admin/calendar/calendar.component').then((m) => m.CalendarComponent) },
      { path: 'services', title: `Services | Admin`, loadComponent: () => import('./pages/admin/services/services.component').then((m) => m.AdminServicesComponent) },
      { path: 'portfolio', title: `Portfolio | Admin`, loadComponent: () => import('./pages/admin/portfolio/portfolio.component').then((m) => m.AdminPortfolioComponent) },
      { path: 'certifications', title: `Certifications | Admin`, loadComponent: () => import('./pages/admin/certifications/certifications.component').then((m) => m.AdminCertificationsComponent) },
      { path: 'schedule', title: `Business Schedule | Admin`, loadComponent: () => import('./pages/admin/schedule/schedule.component').then((m) => m.ScheduleComponent) },
      { path: 'home-service', title: `Home Service | Admin`, loadComponent: () => import('./pages/admin/home-service/home-service.component').then((m) => m.HomeServiceAdminComponent) },
      { path: 'settings', title: `Settings | Admin`, loadComponent: () => import('./pages/admin/settings/settings.component').then((m) => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
