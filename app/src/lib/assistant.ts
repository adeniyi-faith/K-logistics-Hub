// The AI Assistant's answers for the demo.
//
// The real version will send the question, plus a summary of the business data, to Google's
// Gemini (a Flash 3 model) and show its reply. Until there is a Gemini key, this file stands in:
// it spots common kinds of question by their words and works the answer out from the same data
// every other screen uses, so the figures are real for the sample data.
import { AppState } from '../data/types';
import { count, dayLabel, naira } from './format';
import { dayMoney, deliveredOn, isLow, orderTotal, riderDay, shiftDay, stockFor } from './stock';

export type Answer = {
  text: string;
  /** Short label/value lines shown under the text, e.g. "Sales · ₦215,000". */
  facts?: { label: string; value: string }[];
  /** Buttons that open the screen the answer came from. */
  links?: { label: string; href: string }[];
};

export const SUGGESTIONS = [
  'How much did we sell today?',
  'What is our profit this week?',
  'Which products are running low?',
  'Best-selling product this week?',
  'Which rider delivered the most?',
  'Who is our biggest customer?',
];

type Period = { days: string[]; name: string };

function periodOf(state: AppState, q: string): Period {
  if (/yesterday/.test(q)) {
    const d = shiftDay(state.day, -1);
    return { days: [d], name: 'yesterday' };
  }
  if (/week|7 days|seven days/.test(q)) {
    return { days: Array.from({ length: 7 }, (_, i) => shiftDay(state.day, -i)), name: 'in the last 7 days' };
  }
  return { days: [state.day], name: 'today' };
}

function sumMoney(state: AppState, days: string[]) {
  return days.reduce(
    (t, d) => {
      const m = dayMoney(state, d);
      return {
        sales: t.sales + m.sales,
        salesCount: t.salesCount + m.salesCount,
        costOfGoods: t.costOfGoods + m.costOfGoods,
        expenses: t.expenses + m.expenses,
        profit: t.profit + m.profit,
      };
    },
    { sales: 0, salesCount: 0, costOfGoods: 0, expenses: 0, profit: 0 },
  );
}

/** Works out a reply to one question. Words are matched loosely, so "how much we sell" works too. */
export function demoAnswer(state: AppState, question: string): Answer {
  const q = question.toLowerCase();
  const period = periodOf(state, q);

  // A product named in the question: "How many Sootra do we have?"
  const product = state.products.find((p) => {
    const first = p.name.toLowerCase().split(' ')[0];
    return q.includes(p.name.toLowerCase()) || (first.length > 3 && q.includes(first));
  });

  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q)) {
    return {
      text: 'Hello! Ask me anything about the business: orders, profit, stock, riders, customers or expenses.',
    };
  }

  if (product && /(how many|left|stock|have|remain)/.test(q)) {
    const line = stockFor(state, product.id);
    return {
      text: `You have ${count(line.closing, product.unit)} of ${product.name} in store right now.${
        isLow(product, line) ? ' That is at or below its low-stock level, so it is time to reorder.' : ''
      }`,
      facts: [
        { label: 'Opening today', value: String(line.opening) },
        { label: 'Received today', value: String(line.received) },
        { label: 'Delivered today', value: String(line.delivered) },
        { label: 'In store now', value: String(line.closing) },
      ],
      links: [{ label: `Open ${product.name}`, href: `/product/${product.id}` }],
    };
  }

  if (/(low|run(ning)? out|reorder|restock|finish)/.test(q)) {
    const low = state.products
      .map((p) => ({ p, line: stockFor(state, p.id) }))
      .filter((x) => isLow(x.p, x.line))
      .sort((a, b) => a.line.closing - b.line.closing);
    if (!low.length) return { text: 'Nothing is running low right now. Every product is above its low-stock level.' };
    return {
      text: `${low.length} ${low.length === 1 ? 'product is' : 'products are'} running low. ${low[0].p.name} is the lowest, with ${count(
        low[0].line.closing,
        low[0].p.unit,
      )} left.`,
      facts: low.slice(0, 6).map((x) => ({ label: x.p.name, value: `${x.line.closing} left` })),
      links: [{ label: 'See stock', href: '/admin/stock' }],
    };
  }

  if (/(best|top|most).*(sell|product|sold)|(sell|sold).*(most|best)/.test(q)) {
    const units = new Map<string, number>();
    for (const o of state.orders) {
      if (o.status === 'failed' || !period.days.includes(o.day)) continue;
      for (const it of o.items) units.set(it.productId, (units.get(it.productId) ?? 0) + it.qty);
    }
    const ranked = [...units.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return { text: `No products were sold ${period.name}.` };
    const name = (id: string) => state.products.find((p) => p.id === id)?.name ?? 'Product';
    return {
      text: `${name(ranked[0][0])} sold the most ${period.name}, with ${ranked[0][1]} units.`,
      facts: ranked.slice(0, 5).map(([id, n]) => ({ label: name(id), value: `${n} units` })),
    };
  }

  if (/(rider|deliver(ed|ies)? the most|emeka|tunde|musa)/.test(q) && !/pending|waiting|left/.test(q)) {
    const named = state.riders.find((r) => q.includes(r.name.split(' ')[0].toLowerCase()));
    const rows = (named ? [named] : state.riders).map((r) => {
      const t = period.days.reduce(
        (acc, d) => {
          const x = riderDay(state, r.id, d);
          return { delivered: acc.delivered + x.delivered, earned: acc.earned + x.earned };
        },
        { delivered: 0, earned: 0 },
      );
      return { r, ...t };
    });
    rows.sort((a, b) => b.delivered - a.delivered);
    const top = rows[0];
    return {
      text: named
        ? `${top.r.name} completed ${top.delivered} ${top.delivered === 1 ? 'delivery' : 'deliveries'} ${period.name} and earned ${naira(top.earned)}.`
        : `${top.r.name} delivered the most ${period.name}: ${top.delivered} ${top.delivered === 1 ? 'delivery' : 'deliveries'}, earning ${naira(top.earned)}.`,
      facts: rows.map((x) => ({ label: x.r.name, value: `${x.delivered} delivered · ${naira(x.earned)}` })),
    };
  }

  if (/(pending|waiting|not (yet )?delivered|outstanding|left to deliver)/.test(q)) {
    const pending = state.orders.filter((o) => o.status === 'pending');
    if (!pending.length) return { text: 'There are no pending deliveries. Every order has been delivered.' };
    const rider = (id: string) => state.riders.find((r) => r.id === id)?.name.split(' ')[0] ?? 'No rider';
    return {
      text: `${pending.length} ${pending.length === 1 ? 'delivery is' : 'deliveries are'} still pending, worth ${naira(
        pending.reduce((s, o) => s + orderTotal(o), 0),
      )} in total.`,
      facts: pending.map((o) => ({ label: `${o.customer} (${o.area})`, value: rider(o.riderId) })),
      links: [{ label: 'See orders', href: '/admin/sales' }],
    };
  }

  if (/(customer|buyer|client)/.test(q)) {
    const spent = new Map<string, number>();
    for (const o of state.orders) {
      if (o.status !== 'delivered') continue;
      spent.set(o.customerId, (spent.get(o.customerId) ?? 0) + orderTotal(o));
    }
    const ranked = [...spent.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return { text: 'No customer has a delivered order yet.' };
    const name = (id: string) => state.customers.find((c) => c.id === id)?.name ?? 'Customer';
    return {
      text: `${name(ranked[0][0])} is your biggest customer, with ${naira(ranked[0][1])} of delivered orders.`,
      facts: ranked.slice(0, 5).map(([id, n]) => ({ label: name(id), value: naira(n) })),
      links: [{ label: 'Open customer', href: `/customer/${ranked[0][0]}` }],
    };
  }

  if (/(expense|spend|spent|cost)/.test(q) && !/goods/.test(q)) {
    const list = state.expenses.filter((e) => period.days.includes(e.day));
    if (!list.length) return { text: `No expenses were recorded ${period.name}.` };
    return {
      text: `You spent ${naira(list.reduce((s, e) => s + e.amount, 0))} ${period.name}, across ${list.length} ${
        list.length === 1 ? 'expense' : 'expenses'
      }.`,
      facts: list.map((e) => ({ label: `${e.category}: ${e.note}`, value: naira(e.amount) })),
    };
  }

  if (/(profit|gain|make|made|earn)/.test(q)) {
    const m = sumMoney(state, period.days);
    return {
      text: `Your profit ${period.name} is ${naira(m.profit)}. That is sales of ${naira(m.sales)}, minus ${naira(
        m.costOfGoods,
      )} for the goods and ${naira(m.expenses)} of expenses.`,
      facts: [
        { label: 'Sales', value: naira(m.sales) },
        { label: 'Cost of goods', value: naira(m.costOfGoods) },
        { label: 'Expenses', value: naira(m.expenses) },
        { label: 'Profit', value: naira(m.profit) },
      ],
      links: [{ label: 'Open day record', href: '/day-record' }],
    };
  }

  if (/(sale|sell|sold|revenue|income|money)/.test(q)) {
    const m = sumMoney(state, period.days);
    const firstDay = period.days[period.days.length - 1];
    return {
      text: `You sold ${naira(m.sales)} ${period.name}, from ${m.salesCount} ${m.salesCount === 1 ? 'order' : 'orders'}.`,
      facts: [
        { label: 'Sales', value: naira(m.sales) },
        { label: 'Orders', value: String(m.salesCount) },
        ...(period.days.length > 1 ? [{ label: 'Period', value: `${dayLabel(firstDay)} to ${dayLabel(state.day)}` }] : []),
      ],
      links: [{ label: 'See orders', href: '/admin/sales' }],
    };
  }

  if (/deliver/.test(q)) {
    const done = state.orders.filter((o) => o.status === 'delivered' && period.days.includes(deliveredOn(o)));
    return { text: `${done.length} ${done.length === 1 ? 'order was' : 'orders were'} delivered ${period.name}.` };
  }

  return {
    text:
      'This demo can only answer questions about orders, profit, stock, riders, customers, deliveries and expenses. ' +
      'The real assistant, powered by Gemini, will understand questions asked in any wording.',
  };
}
