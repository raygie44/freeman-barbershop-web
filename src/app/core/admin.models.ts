import { Holiday } from './models';

export interface User { id: number; name: string; email: string; phone: string | null; role: 'admin' | 'barber' | 'customer'; }

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface AdminStats {
  today: number; pending: number; upcoming: number; home_service_upcoming: number;
  completed_this_month: number; revenue_this_month: number;
}

export interface AdminService { id: number; name: string; description: string | null; price: string | number; duration: number; status: boolean; sort_order: number; }
export interface AdminBarber { id: number; name: string; description: string | null; profile_image_url: string | null; status: boolean; }
export interface AdminPortfolio { id: number; title: string; description: string | null; category: string; image_url: string; date: string | null; status: boolean; }
export interface AdminCert { id: number; title: string; organization: string; date_received: string | null; description: string | null; file_url: string; status: boolean; }
export interface BlockedSlot { id: number; barber_id: number | null; date: string; start_time: string | null; end_time: string | null; reason: string | null; }
export interface AdminArea { id: number; name: string; extra_fee: string | number; status: boolean; }
export interface HomeServiceData { enabled: boolean; fee: number; areas: AdminArea[]; }

export interface CalendarAppt {
  id: number; reference: string; status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  date: string; start: string; end: string; customer: string; service: string; type: 'in_store' | 'home_service';
}
export interface CalendarData { appointments: CalendarAppt[]; blocked: BlockedSlot[]; holidays: Holiday[]; }

export type AdminSettings = Record<string, string>;

/** Keep in sync with PortfolioItem::CATEGORIES on the API. */
export const PORTFOLIO_CATEGORIES: [string, string][] = [
  ['low-fade', 'Low Fade'], ['mid-fade', 'Mid Fade'], ['high-fade', 'High Fade'], ['taper-fade', 'Taper Fade'],
  ['skin-fade', 'Skin Fade'], ['classic-cut', 'Classic Cut'], ['modern-hairstyles', 'Modern Hairstyles'],
  ['kids-haircut', 'Kids Haircut'], ['beard-styling', 'Beard Styling'],
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
