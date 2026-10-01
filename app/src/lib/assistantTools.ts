// The look-ups Gemini can ask for while answering a question.
//
// Gemini never reads the database itself. When it needs figures it asks for one of these by name
// (the list Gemini sees is in supabase/functions/assistant/index.ts; the names must match), the
// phone works the answer out from its own synced copy of the data, and sends it back.
// That way the figures use the same sums as every other screen, and Gemini only ever sees
// what the signed-in person is already allowed to see.
import { AppState, Order } from '../data/types';
import { itemsText } from './sales';
import { dayMoney, deliveredOn, isLow, orderTotal, riderDay, shiftDay, stockFor } from './stock';

type Args = Record<string, unknown>;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const has = (hay: string, needle: string) => !needle || hay.toLowerCase().includes(needle.toLowerCase());
const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Every day from start to end, both included. At most 366 days; the open day if none are given. */
function daysBetween(state: AppState, args: Args): string[] {
  const end = isDay(text(args.endDay)) ? text(args.endDay) : state.day;
  const start = isDay(text(args.startDay)) ? text(args.startDay) : end;
  const days: string[] = [];
  for (let d = start; d <= end && days.length < 366; d = shiftDay(d, 1)) days.push(d);
  return days.length ? days : [end];
}

function orderRow(state: AppState, o: Order) {
  return {
    code: o.code,
    day: o.day,
    customer: o.customer,
    area: o.area,
    rider: state.riders.find((r) => r.id === o.riderId)?.name ?? '',
    items: itemsText(state, o),
    total: orderTotal(o),
    payment: o.payment === 'transfer' ? 'paid by transfer' : 'pay on delivery',
    status: o.status,
    ...(o.status === 'delivered' ? { deliveredDay: deliveredOn(o), receivedBy: o.receivedBy ?? '' } : {}),
    ...(o.failReason ? { failReason: o.failReason } : {}),
  };
}

const TOOLS: Record<string, (state: AppState, args: Args) => unknown> = {
  money_summary(state, args) {
    const days = daysBetween(state, args);
    const perDay = days.map((day) => ({ day, ...dayMoney(state, day) }));
    const total = perDay.reduce(
      (t, d) => ({
        sales: t.sales + d.sales,
        orders: t.orders + d.salesCount,
        costOfGoods: t.costOfGoods + d.costOfGoods,
        expenses: t.expenses + d.expenses,
        profit: t.profit + d.profit,
      }),
      { sales: 0, orders: 0, costOfGoods: 0, expenses: 0, profit: 0 },
    );
    return { from: days[0], to: days[days.length - 1], total, perDay: days.length <= 31 ? perDay : undefined };
  },

  product_sales(state, args) {
    const days = new Set(daysBetween(state, args));
    const rows = new Map<string, { units: number; sales: number }>();
    for (const o of state.orders) {
      if (o.status === 'failed' || !days.has(o.day)) continue;
      for (const it of o.items) {
        const r = rows.get(it.productId) ?? { units: 0, sales: 0 };
        r.units += it.qty;
        r.sales += it.qty * it.unitPrice;
        rows.set(it.productId, r);
      }
    }
    return [...rows.entries()]
      .map(([id, r]) => ({ product: state.products.find((p) => p.id === id)?.name ?? id, ...r }))
      .sort((a, b) => b.units - a.units);
  },

  stock(state, args) {
    const day = isDay(text(args.day)) ? text(args.day) : state.day;
    return state.products
      .filter((p) => has(p.name, text(args.product)))
      .map((p) => {
        const line = stockFor(state, p.id, day);
        const expiries = state.moves
          .filter((m) => m.productId === p.id && m.kind === 'received' && m.expiry)
          .map((m) => m.expiry!)
          .sort();
        return {
          product: p.name,
          group: p.group,
          unit: p.unit,
          day,
          ...line,
          lowStockLevel: p.lowAt,
          isLow: isLow(p, line),
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          nearestExpiry: expiries[0],
          supplier: p.supplier,
        };
      });
  },

  riders(state, args) {
    const days = daysBetween(state, args);
    return state.riders.map((r) => {
      const t = days.reduce(
        (acc, d) => {
          const x = riderDay(state, r.id, d);
          return { delivered: acc.delivered + x.delivered, failed: acc.failed + x.failed, earned: acc.earned + x.earned };
        },
        { delivered: 0, failed: 0, earned: 0 },
      );
      const pendingNow = state.orders.filter((o) => o.riderId === r.id && o.status === 'pending').length;
      return { rider: r.name, phone: r.phone, bike: r.bike, payPerDelivery: r.ratePerDelivery, ...t, pendingNow };
    });
  },

  orders(state, args) {
    const days = new Set(daysBetween(state, args));
    const status = text(args.status);
    const list = state.orders
      .filter(
        (o) =>
          (status === 'pending' ? o.status === 'pending' : days.has(o.day)) &&
          (!status || o.status === status) &&
          has(o.customer, text(args.customer)) &&
          has(state.riders.find((r) => r.id === o.riderId)?.name ?? '', text(args.rider)) &&
          has(o.area, text(args.area)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      count: list.length,
      totalValue: list.reduce((s, o) => s + orderTotal(o), 0),
      orders: list.slice(0, 40).map((o) => orderRow(state, o)),
    };
  },

  customers(state, args) {
    return state.customers
      .filter((c) => has(c.name, text(args.name)) && has(c.area, text(args.area)))
      .map((c) => {
        const mine = state.orders.filter((o) => o.customerId === c.id && o.status !== 'failed');
        const delivered = mine.filter((o) => o.status === 'delivered');
        const riderCount = new Map<string, number>();
        for (const o of delivered) riderCount.set(o.riderId, (riderCount.get(o.riderId) ?? 0) + 1);
        const usual = [...riderCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        return {
          customer: c.name,
          phone: c.phone,
          area: c.area,
          customerSince: c.since,
          orders: mine.length,
          totalBought: delivered.reduce((s, o) => s + orderTotal(o), 0),
          lastOrderDay: mine
            .map((o) => o.day)
            .sort()
            .pop(),
          usualRider: state.riders.find((r) => r.id === usual)?.name,
        };
      })
      .sort((a, b) => b.totalBought - a.totalBought);
  },

  expenses(state, args) {
    const days = new Set(daysBetween(state, args));
    const list = state.expenses.filter((e) => days.has(e.day) && has(e.category, text(args.category)));
    return {
      total: list.reduce((s, e) => s + e.amount, 0),
      expenses: list.map(({ day, category, note, amount }) => ({ day, category, note, amount })),
    };
  },
};

/** Runs one look-up Gemini asked for. Unknown names and errors come back as a message Gemini can read. */
export function runTool(state: AppState, name: string, args: Args = {}): Record<string, unknown> {
  const tool = TOOLS[name];
  if (!tool) return { error: `There is no look-up called ${name}.` };
  try {
    return { result: tool(state, args ?? {}) };
  } catch (e) {
    return { error: `The look-up failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export const TOOL_NAMES = Object.keys(TOOLS);
