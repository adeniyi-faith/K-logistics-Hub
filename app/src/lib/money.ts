// Money over a stretch of days (a day, a week or a month), for the Expenses and Finance screens.
import { AppState, Expense } from '../data/types';
import { dayMoney, deliveredOn, orderUnits, shiftDay } from './stock';

export type PeriodKind = 'day' | 'week' | 'month';

/** A stretch of days, first and last included, as "YYYY-MM-DD". */
export type Period = { kind: PeriodKind; from: string; to: string };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parts(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** The day, week (Monday to Sunday) or month that `day` falls in. */
export function periodOf(kind: PeriodKind, day: string): Period {
  if (kind === 'day') return { kind, from: day, to: day };
  if (kind === 'week') {
    const wd = new Date(`${day}T12:00:00`).getDay(); // 0 = Sunday
    const from = shiftDay(day, -((wd + 6) % 7));
    return { kind, from, to: shiftDay(from, 6) };
  }
  const { y, m } = parts(day);
  const last = new Date(y, m, 0).getDate();
  return { kind, from: ymd(y, m, 1), to: ymd(y, m, last) };
}

/** The period before (n = -1) or after (n = 1) this one. */
export function movePeriod(p: Period, n: number): Period {
  if (p.kind === 'day') return periodOf('day', shiftDay(p.from, n));
  if (p.kind === 'week') return periodOf('week', shiftDay(p.from, 7 * n));
  const { y, m } = parts(p.from);
  const d = new Date(y, m - 1 + n, 1);
  return periodOf('month', ymd(d.getFullYear(), d.getMonth() + 1, 1));
}

export function inPeriod(day: string, p: Period): boolean {
  return day >= p.from && day <= p.to;
}

/** Every day in the period, oldest first. */
export function daysIn(p: Period): string[] {
  const out: string[] = [];
  for (let d = p.from; d <= p.to; d = shiftDay(d, 1)) out.push(d);
  return out;
}

/** "Wed, 30 Sep", "28 Sep – 4 Oct 2026", "September 2026" */
export function periodLabel(p: Period): string {
  const a = parts(p.from);
  const b = parts(p.to);
  if (p.kind === 'month') return `${FULL_MONTHS[a.m - 1]} ${a.y}`;
  if (p.kind === 'day') {
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${p.from}T12:00:00`).getDay()];
    return `${wd}, ${a.d} ${MONTHS[a.m - 1]} ${a.y}`;
  }
  const left = a.m === b.m ? `${a.d}` : `${a.d} ${MONTHS[a.m - 1]}`;
  return `${left} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
}

/** 1204000 -> "₦1.20m", 152500 -> "₦152.5k", 52500 -> "₦52,500" (for tight spaces). */
export function shortNaira(n: number): string {
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${sign}₦${(a / 1_000_000).toFixed(2)}m`;
  if (a >= 100_000) return `${sign}₦${Number((a / 1000).toFixed(1))}k`;
  return `${sign}₦${Math.round(a).toLocaleString('en-US')}`;
}

export function expensesIn(state: AppState, p: Period): Expense[] {
  return state.expenses.filter((e) => inPeriod(e.day, p));
}

/** Expenses added up per category, biggest first. */
export function byCategory(expenses: Expense[]): { category: string; amount: number }[] {
  const sums = new Map<string, number>();
  for (const e of expenses) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  return [...sums].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

/** Profit = Sales − Cost of goods sold − Expenses, added up over the period. */
export function periodMoney(state: AppState, p: Period) {
  const days = daysIn(p).map((d) => ({ day: d, ...dayMoney(state, d) }));
  const sum = (k: 'sales' | 'costOfGoods' | 'expenses' | 'profit' | 'salesCount') => days.reduce((s, d) => s + d[k], 0);

  const orders = state.orders.filter((o) => inPeriod(o.day, p) && o.status !== 'failed');
  const delivered = state.orders.filter((o) => o.status === 'delivered' && inPeriod(deliveredOn(o), p));
  const ridersUsed = new Set(delivered.map((o) => o.riderId)).size;

  // Profit per product: what it sold for minus its current cost price.
  const cost = new Map(state.products.map((p2) => [p2.id, p2.costPrice]));
  const perProduct = new Map<string, { units: number; profit: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const row = perProduct.get(it.productId) ?? { units: 0, profit: 0 };
      row.units += it.qty;
      row.profit += it.qty * (it.unitPrice - (cost.get(it.productId) ?? 0));
      perProduct.set(it.productId, row);
    }
  }
  const products = [...perProduct].map(([productId, v]) => ({ productId, ...v })).sort((a, b) => b.profit - a.profit);

  const expenses = expensesIn(state, p);
  return {
    days,
    sales: sum('sales'),
    salesCount: sum('salesCount'),
    costOfGoods: sum('costOfGoods'),
    expenses: sum('expenses'),
    profit: sum('profit'),
    unitsSold: orders.reduce((s, o) => s + orderUnits(o), 0),
    unitsDelivered: delivered.reduce((s, o) => s + orderUnits(o), 0),
    deliveries: delivered.length,
    ridersUsed,
    staffPay: expenses.filter((e) => e.category === 'Staff pay').reduce((s, e) => s + e.amount, 0),
    categories: byCategory(expenses),
    products,
  };
}

/** One rider's deliveries and earnings for each day of the period, newest first. */
export function riderDays(state: AppState, riderId: string, p: Period) {
  const rate = state.riders.find((r) => r.id === riderId)?.ratePerDelivery ?? 0;
  const done = state.orders.filter((o) => o.riderId === riderId && o.status === 'delivered' && inPeriod(deliveredOn(o), p));
  return daysIn(p)
    .map((day) => {
      const n = done.filter((o) => deliveredOn(o) === day).length;
      return { day, deliveries: n, earned: n * rate };
    })
    .reverse();
}
