export const SETTING_KEYS = [
  'shop_name', 'tagline', 'established', 'address', 'phone', 'email',
  'facebook', 'instagram', 'tiktok', 'maps_url',
  'home_service_enabled', 'home_service_fee',
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type Settings = Record<SettingKey, string>;
export type ApiSettings = Record<SettingKey, string | null>;

export interface BusinessHour {
  day: number; // 0 = Sunday ... 6 = Saturday
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
  break_start: string | null;
  break_end: string | null;
}
export interface Holiday { id: number; date: string; name: string; }

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  duration: number;
}
export interface Barber {
  id: number;
  name: string;
  description: string | null;
  profile_image_url: string | null;
}
export interface ServiceArea { id: number; name: string; extra_fee: string | number; }

export interface PortfolioItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  category_label: string;
  image_url: string;
  date: string | null;
}
export interface PortfolioResponse { categories: Record<string, string>; items: PortfolioItem[]; }

export interface Certification {
  id: number;
  title: string;
  organization: string;
  date_received: string | null;
  description: string | null;
  file_url: string;
  is_pdf: boolean;
}

export interface Slot { time: string; label: string; available: boolean; status: 'AVAILABLE' | 'BOOKED'; }

export type BookingType = 'in_store' | 'home_service';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: number;
  reference: string;
  status: BookingStatus;
  customer: { name: string; phone: string; email: string };
  service?: { id: number; name: string; duration: number };
  barber?: { id: number; name: string };
  date: string;
  time: string;
  time_label: string;
  end_time: string;
  booking_type: BookingType;
  location: string | null;
  landmark: string | null;
  notes: string | null;
  service_price: number;
  home_service_fee: number;
  total_price: number;
  cancel_reason: string | null;
  created_at: string | null;
}

export interface BookingRequest {
  service_id: number;
  barber_id: number;
  date: string;
  time: string;
  booking_type: BookingType;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address?: string;
  landmark?: string;
  service_area_id?: number | null;
  notes?: string;
}
