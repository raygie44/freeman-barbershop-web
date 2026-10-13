import { Settings } from './models';

/**
 * EDIT ME: text that isn't stored in the database yet.
 * Anything left empty is simply hidden on the site.
 */
export const SITE = {
  barberName: 'Mac Curameng',
  barberTitle: 'Head Barber & Founder',
  intro:
    'Fresh fades, clean tapers and classic cuts, done with precision and care. Book online in under a minute, in the shop or at your home.',

  yearsExperience: '', // e.g. '5+'  (empty = hidden)
  skills: ['Skin, low, mid & high fades', 'Tapers & classic cuts', 'Modern hairstyles', 'Beard trim & styling', 'Kids haircuts', 'Home service'],
  story: [
    'Freeman Barbershop was built on a simple idea: everyone deserves a sharp, confident look without the hassle.',
    'Every cut starts with a conversation about what you want, followed by clean lines, careful blending and attention to detail.',
  ],
  achievements: [] as string[], // e.g. ['Completed professional barbering course']

  // Add REAL customer reviews only, e.g. { name: 'Juan D.', text: 'Best fade in town!', service: 'Skin Fade' }
  testimonials: [] as { name: string; text: string; service?: string }[],

  facebookName: 'Mac Curameng',
  instagramHandle: '@maccurameng',
  facebookFallback: 'https://www.facebook.com/search/top?q=Mac%20Curameng',
  instagramFallback: 'https://instagram.com/maccurameng',
};

/** Shown instantly while the API loads (and if it can't be reached). */
export const DEFAULT_SETTINGS: Settings = {
  shop_name: 'Freeman Barbershop',
  tagline: 'Modern & Classic',
  established: '2026',
  address: 'Purok 4 Sto Tomas South, Jaen, Nueva Ecija',
  phone: '0918 397 5969',
  email: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  maps_url: '',
  home_service_enabled: '0',
  home_service_fee: '0',
};
