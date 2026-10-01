// The automatic sums from design/DESIGN.md, kept in one place so every screen agrees.
import { AppState, Order, Product } from '../data/types';

export type StockLine = { opening: number; received: number; delivered: number; closing: number };

/** Closing stock = Opening + Received − Delivered (for the current day). */
export function stockFor(state: AppState, productId: string): StockLine {
  const opening = state.opening[productId] ?? 0;
  let received = 0;
  let delivered = 0;
  for (const m of state.moves) {
    if (m.day !== state.day || m.productId !== productId) continue;
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

/** Today's money: Profit = Sales − Cost of goods sold − Expenses. */
export function dayMoney(state: AppState) {
  const cost = new Map(state.products.map((p) => [p.id, p.costPrice]));
  const orders = state.orders.filter((o) => o.day === state.day && o.status !== 'failed');
  const sales = orders.reduce((s, o) => s + orderTotal(o), 0);
  const costOfGoods = orders.reduce((s, o) => s + o.items.reduce((t, it) => t + it.qty * (cost.get(it.productId) ?? 0), 0), 0);
  const expenses = state.expenses.filter((e) => e.day === state.day).reduce((s, e) => s + e.amount, 0);
  return { sales, salesCount: orders.length, costOfGoods, expenses, profit: sales - costOfGoods - expenses };
}

/** Rider earnings = completed deliveries × the rider's rate. */
export function riderDay(state: AppState, riderId: string, day = state.day) {
  const mine = state.orders.filter((o) => o.riderId === riderId && o.day === day);
  const delivered = mine.filter((o) => o.status === 'delivered');
  const rate = state.riders.find((r) => r.id === riderId)?.ratePerDelivery ?? 0;
  return {
    assigned: mine.length,
    delivered: delivered.length,
    left: mine.filter((o) => o.status === 'pending').length,
    failed: mine.filter((o) => o.status === 'failed').length,
    earned: delivered.length * rate,
  };
}

/** True when this record is saved on the phone but not uploaded yet. */
export function notSynced(state: AppState, id: string): boolean {
  return state.pending.some((c) => c.ref === id);
}
