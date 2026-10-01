// The automatic sums from design/DESIGN.md, kept in one place so every screen agrees.
import { AppState, Order, Product } from '../data/types';

export type StockLine = { opening: number; received: number; delivered: number; closing: number };

/** Closing stock = Opening + Received − Delivered, for one day (the open day unless given). */
export function stockFor(state: AppState, productId: string, day = state.day): StockLine {
  const opening = state.openings[day]?.[productId] ?? 0;
  let received = 0;
  let delivered = 0;
  for (const m of state.moves) {
    if (m.day !== day || m.productId !== productId) continue;
    if (m.kind === 'received') received += m.qty;
    else delivered += m.qty;
  }
  return { opening, received, delivered, closing: opening + received - delivered };
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
