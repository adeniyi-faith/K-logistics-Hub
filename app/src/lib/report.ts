// Reports: one table of rows plus a few headline numbers, for any period and filters.
// The same report is shown on screen and exported as PDF or Excel.
import { AppState } from '../data/types';
import { frequencyLabel } from './expenses';
import { count, dayLabel, naira } from './format';
import { daysIn, inPeriod, Period, periodLabel, periodMoney } from './money';
import { payeeName, PAY_CATEGORY } from './pay';
import { itemsText } from './sales';
import { deliveredOn, orderTotal, orderUnits, stockFor } from './stock';

export type ReportKind = 'sales' | 'stock' | 'expenses' | 'profit' | 'customer' | 'rider' | 'pay';

export const REPORTS: { value: ReportKind; label: string; adminOnly?: boolean }[] = [
  { value: 'sales', label: 'Sales' },
  { value: 'stock', label: 'Stock' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'profit', label: 'Profit & loss', adminOnly: true },
  { value: 'customer', label: 'Customer statement' },
  { value: 'rider', label: 'Rider deliveries' },
  { value: 'pay', label: 'Staff pay', adminOnly: true },
];

/** Which filters each report uses. */
export const FILTERS: Record<ReportKind, ('product' | 'customer' | 'staff' | 'rider')[]> = {
  sales: ['product', 'customer', 'staff', 'rider'],
  stock: ['product'],
  expenses: [],
  profit: [],
  customer: ['customer'],
  rider: ['rider'],
  pay: [],
};

export type Filters = { product?: string; customer?: string; staff?: string; rider?: string };

export type Report = {
  title: string;
  period: string;
  /** Headline numbers, e.g. ["Total sales", "₦1,204,000"]. */
  summary: [string, string][];
  columns: string[];
  /** Columns that hold numbers or money (lined up on the right). */
  numeric: number[];
  rows: string[][];
  total?: string[];
  /** Shown instead of the table when it would be empty or the report needs a filter. */
  empty?: string;
};

export function buildReport(state: AppState, kind: ReportKind, p: Period, f: Filters): Report {
  const title = REPORTS.find((r) => r.value === kind)!.label;
  const base = { title, period: periodLabel(p) };
  const products = new Map(state.products.map((x) => [x.id, x]));
  const riders = new Map(state.riders.map((r) => [r.id, r]));
  const cost = (id: string) => products.get(id)?.costPrice ?? 0;

  if (kind === 'sales') {
    const orders = state.orders
      .filter((o) => inPeriod(o.day, p) && o.status !== 'failed')
      .filter((o) => !f.product || o.items.some((it) => it.productId === f.product))
      .filter((o) => !f.customer || o.customerId === f.customer)
      .filter((o) => !f.staff || o.takenBy === f.staff)
      .filter((o) => !f.rider || o.riderId === f.rider)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const sales = orders.reduce((s, o) => s + orderTotal(o), 0);
    const profit = orders.reduce((s, o) => s + o.items.reduce((t, it) => t + it.qty * (it.unitPrice - cost(it.productId)), 0), 0);
    const top = (key: (o: (typeof orders)[number]) => string) => {
      const m = new Map<string, number>();
      for (const o of orders) m.set(key(o), (m.get(key(o)) ?? 0) + orderTotal(o));
      return [...m].sort((a, b) => b[1] - a[1])[0]?.[0];
    };
    const unitsBy = new Map<string, number>();
    for (const o of orders) for (const it of o.items) unitsBy.set(it.productId, (unitsBy.get(it.productId) ?? 0) + it.qty);
    const topProduct = [...unitsBy].sort((a, b) => b[1] - a[1])[0]?.[0];
    const delivered = orders.filter((o) => o.status === 'delivered');
    const topRider = top((o) => o.riderId);
    return {
      ...base,
      summary: [
        ['Total sales', naira(sales)],
        ['Units sold', String(orders.reduce((s, o) => s + orderUnits(o), 0))],
        ...(state.session?.role === 'admin' ? [['Profit on goods', naira(profit)] as [string, string]] : []),
        ['Deliveries', String(delivered.length)],
        ['Top customer', top((o) => o.customer) ?? '—'],
        ['Top product', topProduct ? (products.get(topProduct)?.name ?? '—') : '—'],
        ['Top rider', topRider ? (riders.get(topRider)?.name ?? '—') : '—'],
      ],
      columns: ['Date', 'Order', 'Customer', 'Items', 'Rider', 'Taken by', 'Status', 'Amount'],
      numeric: [7],
      rows: orders.map((o) => [
        dayLabel(o.day),
        o.code,
        o.customer,
        itemsText(state, o),
        riders.get(o.riderId)?.name ?? '',
        o.takenBy,
        o.status === 'delivered' ? 'Delivered' : 'Pending',
        naira(orderTotal(o)),
      ]),
      total: ['Total', '', '', '', '', '', '', naira(sales)],
      empty: orders.length ? undefined : 'No sales match.',
    };
  }

  if (kind === 'stock') {
    const days = daysIn(p).filter((d) => d <= state.day);
    const list = state.products.filter((x) => !f.product || x.id === f.product);
    const rows = list.map((x) => {
      const lines = days.map((d) => stockFor(state, x.id, d));
      const received = lines.reduce((s, l) => s + l.received, 0);
      const delivered = lines.reduce((s, l) => s + l.delivered, 0);
      return [
        x.name,
        String(lines[0]?.opening ?? 0),
        String(received),
        String(delivered),
        String(lines[lines.length - 1]?.closing ?? 0),
      ];
    });
    return {
      ...base,
      summary: [
        ['Products', String(list.length)],
        ['Received', `${rows.reduce((s, r) => s + Number(r[2]), 0)} units`],
        ['Delivered', `${rows.reduce((s, r) => s + Number(r[3]), 0)} units`],
      ],
      columns: ['Product', 'Opening', 'Received', 'Delivered', 'Closing'],
      numeric: [1, 2, 3, 4],
      rows,
      empty: days.length ? undefined : 'This period has not started yet.',
    };
  }

  if (kind === 'expenses' || kind === 'pay') {
    const list = state.expenses
      .filter((e) => inPeriod(e.day, p) && (kind === 'expenses' || e.category === PAY_CATEGORY))
      .sort((a, b) => a.day.localeCompare(b.day));
    const total = list.reduce((s, e) => s + e.amount, 0);
    return {
      ...base,
      summary: [
        [kind === 'pay' ? 'Total paid' : 'Total expenses', naira(total)],
        [kind === 'pay' ? 'Payments' : 'Expenses', String(list.length)],
      ],
      columns: kind === 'pay' ? ['Date', 'Paid to', 'Note', 'Amount'] : ['Date', 'Category', 'Note', 'How often', 'Amount'],
      numeric: kind === 'pay' ? [3] : [4],
      rows: list.map((e) =>
        kind === 'pay'
          ? [dayLabel(e.day), payeeName(state, e.payee) ?? '', e.note, naira(e.amount)]
          : [
              dayLabel(e.day),
              e.bike ? `${e.category} · ${e.bike}` : e.category,
              e.note,
              frequencyLabel(e.frequency),
              naira(e.amount),
            ],
      ),
      total: kind === 'pay' ? ['Total', '', '', naira(total)] : ['Total', '', '', '', naira(total)],
      empty: list.length ? undefined : kind === 'pay' ? 'No payments in this period.' : 'No expenses in this period.',
    };
  }

  if (kind === 'profit') {
    const m = periodMoney(state, p);
    const days = m.days.filter((d) => d.day <= state.day);
    return {
      ...base,
      summary: [
        ['Sales', naira(m.sales)],
        ['Cost of goods', naira(m.costOfGoods)],
        ['Expenses', naira(m.expenses)],
        ['Profit', naira(m.profit)],
      ],
      columns: ['Date', 'Sales', 'Cost of goods', 'Expenses', 'Profit'],
      numeric: [1, 2, 3, 4],
      rows: days.map((d) => [dayLabel(d.day), naira(d.sales), naira(d.costOfGoods), naira(d.expenses), naira(d.profit)]),
      total: ['Total', naira(m.sales), naira(m.costOfGoods), naira(m.expenses), naira(m.profit)],
      empty: days.length ? undefined : 'This period has not started yet.',
    };
  }

  if (kind === 'customer') {
    const c = state.customers.find((x) => x.id === f.customer);
    if (!c) return { ...base, summary: [], columns: [], numeric: [], rows: [], empty: 'Pick a customer to see their statement.' };
    const orders = state.orders
      .filter((o) => o.customerId === c.id && inPeriod(o.day, p) && o.status !== 'failed')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const total = orders.reduce((s, o) => s + orderTotal(o), 0);
    return {
      ...base,
      title: `${c.name} statement`,
      summary: [
        ['Customer', `${c.name} · ${c.phone}`],
        ['Orders', String(orders.length)],
        ['Total bought', naira(total)],
      ],
      columns: ['Date', 'Order', 'Items', 'Payment', 'Status', 'Amount'],
      numeric: [5],
      rows: orders.map((o) => [
        dayLabel(o.day),
        o.code,
        itemsText(state, o),
        o.payment === 'transfer' ? 'Transfer' : 'On delivery',
        o.status === 'delivered' ? 'Delivered' : 'Pending',
        naira(orderTotal(o)),
      ]),
      total: ['Total', '', '', '', '', naira(total)],
      empty: orders.length ? undefined : `${c.name} has no orders in this period.`,
    };
  }

  // Rider deliveries
  const done = state.orders
    .filter((o) => o.status === 'delivered' && inPeriod(deliveredOn(o), p) && (!f.rider || o.riderId === f.rider))
    .sort((a, b) => (a.deliveredAt ?? '').localeCompare(b.deliveredAt ?? ''));
  const earned = done.reduce((s, o) => s + (riders.get(o.riderId)?.ratePerDelivery ?? 0), 0);
  return {
    ...base,
    summary: [
      ['Deliveries', String(done.length)],
      ['Riders', count(new Set(done.map((o) => o.riderId)).size, 'rider')],
      ['Earned', naira(earned)],
    ],
    columns: ['Date', 'Rider', 'Order', 'Customer', 'Area', 'Received by', 'Earned'],
    numeric: [6],
    rows: done.map((o) => [
      dayLabel(deliveredOn(o)),
      riders.get(o.riderId)?.name ?? '',
      o.code,
      o.customer,
      o.area,
      o.receivedBy ?? '',
      naira(riders.get(o.riderId)?.ratePerDelivery ?? 0),
    ]),
    total: ['Total', '', '', '', '', '', naira(earned)],
    empty: done.length ? undefined : 'No deliveries in this period.',
  };
}

/** A printable page for the PDF. */
export function reportHtml(r: Report, business = 'K-Logistics Hub Ltd'): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cell = (t: string, i: number, tag: 'td' | 'th') =>
    `<${tag}${r.numeric.includes(i) ? ' class="n"' : ''}>${esc(t)}</${tag}>`;
  const table = r.rows.length
    ? `<table><thead><tr>${r.columns.map((c, i) => cell(c, i, 'th')).join('')}</tr></thead><tbody>${r.rows
        .map((row) => `<tr>${row.map((c, i) => cell(c, i, 'td')).join('')}</tr>`)
        .join('')}${r.total ? `<tr class="t">${r.total.map((c, i) => cell(c, i, 'td')).join('')}</tr>` : ''}</tbody></table>`
    : `<p>${esc(r.empty ?? 'Nothing to show.')}</p>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.title)}</title><style>
@page{size:A4 landscape;margin:12mm}
body{font-family:Helvetica,Arial,sans-serif;color:#0F1E3B;margin:32px;font-size:12px}
h1{font-size:20px;margin:0}.sub{color:#5A6378;margin:4px 0 16px}
.sum{display:flex;flex-wrap:wrap;gap:8px 24px;margin-bottom:16px}.sum div{min-width:120px}.sum b{display:block;font-size:14px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E3E7EF}
th{background:#F4F6FA;font-size:11px}.n{text-align:right}.t td{font-weight:bold;border-top:2px solid #0F1E3B}
</style></head><body><h1>${esc(r.title)}</h1><div class="sub">${esc(business)} · ${esc(r.period)}</div>
<div class="sum">${r.summary.map(([k, v]) => `<div>${esc(k)}<b>${esc(v)}</b></div>`).join('')}</div>${table}</body></html>`;
}

/** The table as CSV, which Excel opens. */
export function reportCsv(r: Report): string {
  const q = (t: string) => (/[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t);
  // Money goes in as plain numbers so Excel can add them up.
  const plain = (t: string, i: number) => (r.numeric.includes(i) ? t.replace(/[₦,]/g, '').replace('−', '-') : t);
  const lines = [
    [r.title, r.period],
    ...r.summary,
    [],
    r.columns,
    ...r.rows.map((row) => row.map(plain)),
    ...(r.total ? [r.total.map(plain)] : []),
  ];
  return '﻿' + lines.map((l) => l.map(q).join(',')).join('\r\n');
}

/** A short text version for WhatsApp. */
export function reportText(r: Report): string {
  return [`*${r.title}* · ${r.period}`, ...r.summary.map(([k, v]) => `${k}: ${v}`)].join('\n');
}

export function fileName(r: Report): string {
  return `${r.title} ${r.period}`
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
