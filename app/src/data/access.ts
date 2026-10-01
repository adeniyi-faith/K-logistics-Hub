// Staff access (design/DESIGN.md, "How staff access works").
// Each staff member gets a role as a starting point; Admin can then change single
// things for that one person. Admin and Rider access are fixed.

export type Area = 'stock' | 'sales' | 'customers' | 'riders' | 'expenses' | 'staffpay' | 'finance' | 'reports' | 'settings';

/** off: hidden. view: look only. edit: add and change. */
export type Level = 'off' | 'view' | 'edit';

/** Single switches on top of the areas. */
export type Perm = 'seeCost' | 'closeDay' | 'exportReports';

export type Access = { areas: Record<Area, Level>; perms: Record<Perm, boolean> };

/** What one person has that differs from their role. */
export type Overrides = { areas?: Partial<Record<Area, Level>>; perms?: Partial<Record<Perm, boolean>> };

export type StaffRole = { id: string; name: string; summary: string; access: Access };

export const AREAS_LIST: { value: Area; label: string; sub: string; short: string }[] = [
  { value: 'stock', label: 'Stock', sub: 'Products, receive stock, counts', short: 'Stock' },
  { value: 'sales', label: 'Sales & deliveries', sub: 'New sales, assign riders', short: 'Sales' },
  { value: 'customers', label: 'Customers', sub: 'Profiles and order history', short: 'Customers' },
  { value: 'riders', label: 'Riders & bikes', sub: 'Add riders, status, bikes', short: 'Riders' },
  { value: 'expenses', label: 'Expenses', sub: 'Fuel, repairs, packaging', short: 'Expenses' },
  { value: 'staffpay', label: 'Staff & pay', sub: 'Salaries and payments', short: 'Staff & pay' },
  { value: 'finance', label: 'Finance & profit', sub: 'Sales, costs, profit', short: 'Finance' },
  { value: 'reports', label: 'Reports', sub: 'Filter and look back', short: 'Reports' },
  { value: 'settings', label: 'Business settings', sub: 'Delivery photo and more', short: 'Settings' },
];

export const PERMS_LIST: { value: Perm; label: string; sub: string }[] = [
  { value: 'seeCost', label: 'See cost prices and profit', sub: 'Hides cost and profit on every screen when off' },
  { value: 'closeDay', label: 'Close the day', sub: "Copy closing stock into tomorrow's opening stock" },
  { value: 'exportReports', label: 'Export reports', sub: 'Save reports as PDF or Excel, or share them' },
];

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
];

const levels = (s: string): Record<Area, Level> => {
  // One letter per area in AREAS_LIST order: E = edit, V = view, - = off.
  const m = { E: 'edit', V: 'view', '-': 'off' } as const;
  return Object.fromEntries(AREAS_LIST.map((a, i) => [a.value, m[s[i] as keyof typeof m]])) as Record<Area, Level>;
};

const perms = (seeCost: boolean, closeDay: boolean, exportReports: boolean) => ({ seeCost, closeDay, exportReports });

/** The ready-made roles from the design. Admin can change them or add more. */
export const DEFAULT_ROLES: StaffRole[] = [
  {
    id: 'manager',
    name: 'Manager',
    summary: 'Runs daily operations: stock, sales, customers and riders.',
    access: { areas: levels('EEEEV--E-'), perms: perms(false, false, true) },
  },
  {
    id: 'accounts',
    name: 'Accounts',
    summary: 'Handles money: expenses, staff pay, finance and reports.',
    access: { areas: levels('-V--EEVE-'), perms: perms(true, false, true) },
  },
  {
    id: 'storekeeper',
    name: 'Store keeper',
    summary: 'Receives and counts stock. Sees sales so they can pack orders.',
    access: { areas: levels('EV-------'), perms: perms(false, false, false) },
  },
  {
    id: 'sales',
    name: 'Sales',
    summary: 'Takes orders and looks after customers.',
    access: { areas: levels('VEE------'), perms: perms(false, false, false) },
  },
];

export const FULL_ACCESS: Access = { areas: levels('EEEEEEEEE'), perms: perms(true, true, true) };
export const NO_ACCESS: Access = { areas: levels('---------'), perms: perms(false, false, false) };

/** A role's access with one person's changes on top. */
export function withOverrides(base: Access, o: Overrides | undefined): Access {
  return { areas: { ...base.areas, ...o?.areas }, perms: { ...base.perms, ...o?.perms } };
}

/** Only the things in `access` that differ from the role. */
export function overridesFrom(base: Access, access: Access): Overrides {
  const areas = Object.fromEntries(
    AREAS_LIST.filter((a) => access.areas[a.value] !== base.areas[a.value]).map((a) => [a.value, access.areas[a.value]]),
  );
  const ps = Object.fromEntries(
    PERMS_LIST.filter((p) => access.perms[p.value] !== base.perms[p.value]).map((p) => [p.value, access.perms[p.value]]),
  );
  return { areas, perms: ps };
}

export function changeCount(o: Overrides | undefined): number {
  return Object.keys(o?.areas ?? {}).length + Object.keys(o?.perms ?? {}).length;
}

/** "Close the day turned on, Reports set to view only" */
export function describeChanges(o: Overrides | undefined): string {
  const parts = [
    ...Object.entries(o?.areas ?? {}).map(([a, l]) => {
      const label = AREAS_LIST.find((x) => x.value === a)?.label ?? a;
      return l === 'off' ? `${label} hidden` : l === 'view' ? `${label} set to view only` : `${label} can be changed`;
    }),
    ...Object.entries(o?.perms ?? {}).map(
      ([p, on]) => `${PERMS_LIST.find((x) => x.value === p)?.label ?? p} turned ${on ? 'on' : 'off'}`,
    ),
  ];
  return parts.join(', ');
}

/** Reads a stored JSON text safely. */
export function parseJson<T>(text: unknown, fallback: T): T {
  if (typeof text !== 'string' || !text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
