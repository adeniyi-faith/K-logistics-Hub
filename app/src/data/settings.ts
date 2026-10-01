import { AREAS, EXPENSE_CATEGORIES, Settings } from './types';

/** What a new business starts with. Admin changes these in Business settings. */
export const DEFAULT_SETTINGS: Settings = {
  requirePhoto: false,
  businessName: 'K-Logistics Hub Ltd',
  tagline: 'Swift, fast and reliable.',
  location: 'Port Harcourt, Rivers State',
  expenseCategories: [...EXPENSE_CATEGORIES],
  productGroups: ['Capsules', 'Herbal teas', 'Skin care', 'Oral care', 'Hair care', "Women's health", "Men's health"],
  units: ['bottle', 'box', 'pack', 'jar', 'bar', 'tube'],
  defaultUnit: 'bottle',
  lowStockAt: 5,
  allowZeroStock: false,
  areas: [...AREAS],
  words: { sale: 'Sale', rider: 'Rider' },
};

/** The words Admin can pick for "sale" and "rider". */
export const SALE_WORDS = ['Sale', 'Order', 'Waybill', 'Delivery'];
export const RIDER_WORDS = ['Rider', 'Dispatch rider', 'Driver'];

/** Fills in anything missing (e.g. settings saved by an older version of the app). */
export function withDefaults(saved: Partial<Settings> | null | undefined): Settings {
  const s = saved ?? {};
  const list = (x: unknown, fallback: string[]) => (Array.isArray(x) && x.length ? x.map(String) : fallback);
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    expenseCategories: list(s.expenseCategories, DEFAULT_SETTINGS.expenseCategories),
    productGroups: list(s.productGroups, DEFAULT_SETTINGS.productGroups),
    units: list(s.units, DEFAULT_SETTINGS.units),
    areas: list(s.areas, DEFAULT_SETTINGS.areas),
    words: { ...DEFAULT_SETTINGS.words, ...(s.words ?? {}) },
  };
}
