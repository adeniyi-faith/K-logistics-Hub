import { AppState, Clash } from '../data/types';
import { naira } from './format';

type Kind = 'text' | 'money' | 'number' | 'yesno' | 'whole';

/** Plain names for the columns that can clash, and how to show their values. */
const FIELDS: Record<string, Record<string, [string, Kind]>> = {
  products: {
    name: ['Name', 'text'],
    product_group: ['Group', 'text'],
    unit: ['Unit', 'text'],
    pack: ['What one unit is', 'text'],
    cost_price: ['Cost price', 'money'],
    sell_price: ['Selling price', 'money'],
    low_at: ['Low-stock alert', 'number'],
    nafdac: ['NAFDAC number', 'text'],
    supplier: ['Supplier', 'text'],
    active: ['In use', 'yesno'],
  },
  customers: { name: ['Name', 'text'], phone: ['Phone', 'text'], area: ['Area', 'text'], address: ['Address', 'text'] },
  riders: {
    name: ['Name', 'text'],
    phone: ['Phone', 'text'],
    bike: ['Bike', 'text'],
    rate_per_delivery: ['Pay per delivery', 'money'],
    status: ['Status', 'text'],
    address: ['Address', 'text'],
    pay_account: ['Account number', 'text'],
    pay_bank: ['Bank or wallet', 'text'],
  },
  staff: {
    name: ['Name', 'text'],
    job: ['Job', 'text'],
    phone: ['Phone', 'text'],
    pay: ['Pay', 'money'],
    active: ['On the payroll', 'yesno'],
    role_id: ['Staff role', 'text'],
    overrides: ['Access changes', 'whole'],
    access: ['Access', 'whole'],
  },
  staff_roles: { name: ['Name', 'text'], summary: ['Summary', 'text'], access: ['Access', 'whole'] },
  business: {
    name: ['Business name', 'text'],
    require_photo: ['Delivery photo', 'yesno'],
    settings: ['Business settings', 'whole'],
  },
};

const STATUS: Record<string, string> = { active: 'Working', off_duty: 'Off duty', bike_repair: 'Bike in repair' };

export type ClashView = {
  /** e.g. "Glow Serum · Selling price" */
  title: string;
  /** How each value reads, e.g. "₦21,500". Empty for values too big to show (then Admin picks by who saved it). */
  mine: string;
  theirs: string;
};

/** What a sync clash is about, in words. */
export function describeClash(state: AppState, c: Clash): ClashView {
  const [label, kind] = FIELDS[c.table]?.[c.field] ?? [c.field.replace(/_/g, ' '), 'text'];
  const record =
    c.table === 'products'
      ? state.products.find((x) => x.id === c.rowId)?.name
      : c.table === 'customers'
        ? state.customers.find((x) => x.id === c.rowId)?.name
        : c.table === 'riders'
          ? state.riders.find((x) => x.id === c.rowId)?.name
          : c.table === 'staff'
            ? state.staff.find((x) => x.id === c.rowId)?.name
            : c.table === 'staff_roles'
              ? `${state.roles.find((x) => x.id === c.rowId)?.name ?? ''} role`
              : undefined;
  const show = (v: unknown): string => {
    if (kind === 'whole') return '';
    if (v === null || v === undefined || v === '') return '(empty)';
    if (kind === 'money') return naira(Number(v));
    if (kind === 'yesno') return v === true || v === 1 || v === 'true' ? 'On' : 'Off';
    if (c.field === 'status') return STATUS[String(v)] ?? String(v);
    if (c.field === 'role_id') return state.roles.find((r) => r.id === v)?.name ?? String(v);
    return String(v);
  };
  return { title: record ? `${record} · ${label}` : label, mine: show(c.mine), theirs: show(c.theirs) };
}
