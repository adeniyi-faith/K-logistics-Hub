// Staff & pay sums. Paying someone is written down as a "Staff pay" expense with who was paid.
import { AppState, Staff } from '../data/types';
import { expensesIn, periodOf } from './money';
import { riderOwed } from './riders';

export const PAY_CATEGORY = 'Staff pay';

export function paidIn(state: AppState, payee: string, kind: 'week' | 'month'): number {
  return expensesIn(state, periodOf(kind, state.day))
    .filter((e) => e.payee === payee)
    .reduce((s, e) => s + e.amount, 0);
}

/** What is still due to a staff member for this month (or this week, for weekly pay). */
export function staffDue(state: AppState, x: Staff): number {
  return Math.max(0, x.pay - paidIn(state, x.id, x.payEvery));
}

/** Everyone who gets paid, with what is due to them now. */
export function payroll(state: AppState) {
  const staff = state.staff
    .filter((x) => x.active)
    .map((x) => ({
      id: x.id,
      initials: x.initials,
      name: x.name,
      sub: [x.job, x.phone].filter(Boolean).join(' · '),
      pay: `${x.pay.toLocaleString('en-US')}/${x.payEvery === 'month' ? 'mo' : 'wk'}`,
      paidThisMonth: paidIn(state, x.id, 'month'),
      due: staffDue(state, x),
      dueWhen: x.payEvery === 'month' ? 'this month' : 'this week',
    }));
  const riders = state.riders.map((r) => ({
    id: r.id,
    initials: r.initials,
    name: r.name,
    sub: `Rider · ${r.bike.split(' · ')[0]}`,
    pay: `${r.ratePerDelivery.toLocaleString('en-US')}/delivery`,
    paidThisMonth: paidIn(state, r.id, 'month'),
    due: riderOwed(state, r.id).owed,
    dueWhen: 'for deliveries',
  }));
  return [...staff, ...riders];
}

/** The name of whoever an expense paid, if anyone. */
export function payeeName(state: AppState, payee: string | undefined): string | undefined {
  if (!payee) return undefined;
  return state.staff.find((x) => x.id === payee)?.name ?? state.riders.find((r) => r.id === payee)?.name;
}
