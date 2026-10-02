// The automatic sums from design/DESIGN.md, kept in one place so every screen agrees.
import { AppState, Order, Product } from '../data/types';

export type StockLine = {
  opening: number;
  received: number;
  delivered: number;
  /** Stock count changes (damage, returns, recounts): added minus removed. */
  adjusted: number;
  closing: number;
};

type DayMoves = { received: number; delivered: number; adjusted: number };
type Ledger = {
  /** Per product: its first recorded opening stock (the starting count). */
  start: Map<string, { day: string; qty: number }>;
  /** Per product, per day: what came in and went out. */
  days: Map<string, Map<string, DayMoves>>;
};

// Worked out once per change of the data, not for every product on every screen.
const ledgers = new WeakMap<AppState['moves'], { openings: AppState['openings']; ledger: Ledger }>();

function ledgerOf(state: AppState): Ledger {
  const hit = ledgers.get(state.moves);
  if (hit && hit.openings === state.openings) return hit.ledger;
  const start = new Map<string, { day: string; qty: number }>();
  for (const day of Object.keys(state.openings).sort()) {
    for (const [productId, qty] of Object.entries(state.openings[day])) {
      if (!start.has(productId)) start.set(productId, { day, qty });
    }
  }
  const days = new Map<string, Map<string, DayMoves>>();
  for (const m of state.moves) {
    const byDay = days.get(m.productId) ?? new Map<string, DayMoves>();
    days.set(m.productId, byDay);
    const d = byDay.get(m.day) ?? { received: 0, delivered: 0, adjusted: 0 };
    byDay.set(m.day, d);
    if (m.kind === 'received') d.received += m.qty;
    else if (m.kind === 'delivered') d.delivered += m.qty;
    else if (m.kind === 'added') d.adjusted += m.qty;
    else d.adjusted -= m.qty;
  }
  const ledger = { start, days };
  ledgers.set(state.moves, { openings: state.openings, ledger });
  return ledger;
}

/**
 * Closing stock = Opening + Received − Delivered ± count changes, for one day (the open day unless given).
 * Opening stock is the product's starting count plus everything since, so a sale or delivery that
 * reaches this phone late (another phone was offline) still lands in the right place.
 */
export function stockFor(state: AppState, productId: string, day = state.day): StockLine {
  const { start, days } = ledgerOf(state);
  const first = start.get(productId);
  let opening = first && first.day <= day ? first.qty : 0;
  const today: DayMoves = { received: 0, delivered: 0, adjusted: 0 };
  for (const [d, x] of days.get(productId) ?? []) {
    if (d === day) Object.assign(today, x);
    else if (d < day && (!first || first.day > day || d >= first.day)) opening += x.received - x.delivered + x.adjusted;
  }
  const { received, delivered, adjusted } = today;
  return { opening, received, delivered, adjusted, closing: opening + received - delivered + adjusted };
}

/** For tables with only In and Out columns: count changes go into whichever side they belong. */
export function inOut(line: StockLine): { in: number; out: number } {
  return {
    in: line.received + Math.max(line.adjusted, 0),
    out: line.delivered + Math.max(-line.adjusted, 0),
  };
}

/** Units already promised to orders that are not delivered yet, per product. */
export function promisedStock(state: AppState): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of state.orders) {
    if (o.status !== 'pending') continue;
    for (const it of o.items) m.set(it.productId, (m.get(it.productId) ?? 0) + it.qty);
  }
  return m;
}

export function isLow(p: Product, line: StockLine): boolean {
  return line.closing <= p.lowAt;
}

export function orderTotal(o: Order): number {
  return o.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
}

export function orderUnits(o: Order): number {
  return o.items.reduce((s, it) => s + it.qty, 0);
}

/** One day's money: Profit = Sales − Cost of goods sold − Expenses. */
export function dayMoney(state: AppState, day = state.day) {
  const cost = new Map(state.products.map((p) => [p.id, p.costPrice]));
  const orders = state.orders.filter((o) => o.day === day && o.status !== 'failed');
  const sales = orders.reduce((s, o) => s + orderTotal(o), 0);
  const costOfGoods = orders.reduce((s, o) => s + o.items.reduce((t, it) => t + it.qty * (cost.get(it.productId) ?? 0), 0), 0);
  const expenses = state.expenses.filter((e) => e.day === day).reduce((s, e) => s + e.amount, 0);
  return { sales, salesCount: orders.length, costOfGoods, expenses, profit: sales - costOfGoods - expenses };
}

/** The day an order was delivered on (falls back to the day it was taken). */
export function deliveredOn(o: Order): string {
  return o.deliveredDay ?? o.day;
}

/**
 * One rider's day. Earnings = deliveries completed that day × the rider's rate.
 * Pending orders from earlier days carry over, so "left" counts every pending order.
 */
export function riderDay(state: AppState, riderId: string, day = state.day) {
  const mine = state.orders.filter((o) => o.riderId === riderId);
  const delivered = mine.filter((o) => o.status === 'delivered' && deliveredOn(o) === day);
  const failed = mine.filter((o) => o.status === 'failed' && o.day === day);
  const left = day === state.day ? mine.filter((o) => o.status === 'pending').length : 0;
  const rate = state.riders.find((r) => r.id === riderId)?.ratePerDelivery ?? 0;
  return {
    assigned: delivered.length + failed.length + left,
    delivered: delivered.length,
    left,
    failed: failed.length,
    earned: delivered.length * rate,
  };
}

/** The day after "YYYY-MM-DD". */
export function nextDay(day: string): string {
  return shiftDay(day, 1);
}

/** "YYYY-MM-DD" moved by n days. */
export function shiftDay(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** What closing the day would carry into tomorrow: each product's closing stock. */
export function closingStock(state: AppState): Record<string, number> {
  return Object.fromEntries(state.products.map((p) => [p.id, stockFor(state, p.id).closing]));
}

/** True when this record is saved on the phone but not uploaded yet. */
export function notSynced(state: AppState, id: string): boolean {
  return state.pending.some((c) => c.ref === id);
}
