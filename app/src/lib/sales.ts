// Sums and look-ups for sales, deliveries and customers.
import { AppState, Order } from '../data/types';
import { orderTotal } from './stock';

/** Newest first. */
/** Who an order is for. Orders saved without customer details show where they are going instead. */
export function orderFor(o: Pick<Order, 'customer' | 'area'>): string {
  return o.customer || (o.area ? `Delivery to ${o.area}` : 'No customer');
}

export function byNewest(a: Order, b: Order): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** "Mullein herbal tea × 6 · Sootra × 2" */
export function itemsText(state: AppState, o: Order): string {
  const name = new Map(state.products.map((p) => [p.id, p.name]));
  return o.items.map((it) => `${name.get(it.productId) ?? 'Product'} × ${it.qty}`).join(' · ');
}

export function paymentText(o: Order): string {
  if (o.status === 'delivered' && o.collected) {
    if (o.collected.method === 'cash') return 'Paid · Cash';
    if (o.collected.method === 'transfer') return 'Paid · Transfer';
  }
  return o.payment === 'transfer' ? 'Paid · Transfer' : 'Pay on delivery';
}

/** The rider who last delivered to this customer, used as the default for a new sale. */
export function lastRiderFor(state: AppState, customerId: string): { riderId: string; day: string } | null {
  const last = state.orders
    .filter((o) => o.customerId === customerId && o.status === 'delivered')
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''))[0];
  return last ? { riderId: last.riderId, day: last.day } : null;
}

export function customerStats(state: AppState, customerId: string) {
  const orders = state.orders.filter((o) => o.customerId === customerId).sort(byNewest);
  const live = orders.filter((o) => o.status !== 'failed');
  const delivered = orders.filter((o) => o.status === 'delivered');

  // Who usually delivers to them.
  const count = new Map<string, number>();
  for (const o of delivered) count.set(o.riderId, (count.get(o.riderId) ?? 0) + 1);
  const [usualRider, usualCount] = [...count.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  // What they buy most.
  const bought = new Map<string, { qty: number; value: number }>();
  for (const o of live) {
    for (const it of o.items) {
      const b = bought.get(it.productId) ?? { qty: 0, value: 0 };
      b.qty += it.qty;
      b.value += it.qty * it.unitPrice;
      bought.set(it.productId, b);
    }
  }

  return {
    orders,
    total: live.reduce((s, o) => s + orderTotal(o), 0),
    lastOrder: orders[0]?.day ?? null,
    usualRider,
    usualCount,
    deliveredCount: delivered.length,
    lastDeliveredDay: delivered.sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''))[0]?.day ?? null,
    mostBought: [...bought.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 4),
  };
}

/** Next order number for a day on this phone, e.g. "S-1001-20". */
export function nextOrderCode(state: AppState): string {
  const prefix = `S-${state.day.slice(5).replace('-', '')}-`;
  const used = state.orders.filter((o) => o.code.startsWith(prefix)).map((o) => Number(o.code.slice(prefix.length)) || 0);
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(2, '0')}`;
}
