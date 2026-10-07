import { AppState, Rider } from '../data/types';
import { dayLabel } from './format';
import { deliveryPay, riderDay } from './stock';

/** What a rider is doing now, worked out from their status and today's deliveries. */
export function riderNow(state: AppState, r: Rider): { label: string; kind: 'blue' | 'green' | 'gray' | 'red'; note: string } {
  if (r.status === 'off_duty') return { label: 'Off duty', kind: 'gray', note: 'Rest day' };
  if (r.status === 'bike_repair')
    return { label: 'Bike in repair', kind: 'red', note: r.statusSince ? `Since ${dayLabel(r.statusSince).slice(0, 5)}` : '' };
  const d = riderDay(state, r.id);
  const total = d.delivered + d.left;
  if (d.left > 0) return { label: 'On delivery', kind: 'blue', note: `${d.delivered} of ${total} done` };
  return { label: 'Available', kind: 'green', note: total ? `${d.delivered} of ${total} done` : 'No deliveries yet' };
}

/** "Bike 1 · PHC-234KA" -> { name: "Bike 1", plate: "PHC-234KA" } */
export function bikeParts(bike: string): { name: string; plate: string } {
  const [name = '', plate = ''] = bike.split(' · ');
  return { name, plate };
}

/** Everything a rider has earned, minus everything they've been paid. */
export function riderOwed(state: AppState, riderId: string): { earned: number; paid: number; owed: number } {
  const earned = state.orders
    .filter((o) => o.riderId === riderId && o.status === 'delivered')
    .reduce((s, o) => s + deliveryPay(state, o), 0);
  const paid = state.expenses.filter((e) => e.payee === riderId).reduce((s, e) => s + e.amount, 0);
  return { earned, paid, owed: Math.max(0, earned - paid) };
}
