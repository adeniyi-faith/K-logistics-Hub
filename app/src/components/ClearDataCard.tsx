import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { confirm } from '../lib/confirm';
import { useWords } from '../lib/words';
import { ClearPart } from '../live/types';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { SwitchRow } from './SwitchRow';
import { Text } from './Text';
import { Button, Card, H2, Muted } from './ui';

/** Admin: wipe whole kinds of records, e.g. the sample data the business started with. */
export function ClearDataCard() {
  const { state, mode, clearData, uploadNow } = useStore();
  const w = useWords();
  const [pick, setPick] = useState<Record<ClearPart, boolean>>({
    sales: false,
    stock: false,
    products: false,
    customers: false,
    expenses: false,
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok?: boolean } | null>(null);

  // Products can only go together with the sales and stock records that point at them.
  const on = (p: ClearPart) => pick[p] || ((p === 'sales' || p === 'stock') && pick.products);
  const flip = (p: ClearPart) => (v: boolean) => {
    setNote(null);
    setPick((x) => ({ ...x, [p]: v }));
  };
  const parts = (Object.keys(pick) as ClearPart[]).filter(on);
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  const rows: { part: ClearPart; label: string; sub: string }[] = [
    {
      part: 'sales',
      label: `${w.Sales} and deliveries`,
      sub: `${plural(state.orders.length, w.sale)}. ${w.Rider} earnings from them go too.`,
    },
    {
      part: 'stock',
      label: 'Stock counts',
      sub: `Opening stock and ${plural(state.moves.filter((m) => m.kind === 'received').length, 'stock entry', 'stock entries')} received. Every product goes back to 0.`,
    },
    {
      part: 'products',
      label: 'Products',
      sub: `${plural(state.products.length, 'product')}. Also clears ${w.sales} and stock counts.`,
    },
    { part: 'customers', label: 'Customers', sub: `${plural(state.customers.length, 'customer')}.` },
    { part: 'expenses', label: 'Expenses and pay', sub: `${plural(state.expenses.length, 'record')}.` },
  ];

  const go = async () => {
    if (!parts.length) return setNote({ text: 'Tick what to clear first.' });
    const list = rows
      .filter((r) => parts.includes(r.part))
      .map((r) => r.label.toLowerCase())
      .join(', ');
    const ok = await confirm(
      'Clear this data for good?',
      `This removes all ${list} from every phone in the business. Riders, staff, settings and sign-ins stay. This can't be undone.`,
      'Clear',
    );
    if (!ok) return;
    setBusy(true);
    setNote(null);
    await clearData(parts);
    const sent = await uploadNow();
    setBusy(false);
    setPick({ sales: false, stock: false, products: false, customers: false, expenses: false });
    setNote(
      mode === 'demo' || sent
        ? { ok: true, text: 'Cleared. Other phones catch up next time they are online.' }
        : { ok: true, text: 'Cleared on this phone. It reaches the business once this phone is online.' },
    );
  };

  return (
    <Card>
      <H2>Clear old data</H2>
      <Muted>For removing sample or test records before the business starts using the app for real.</Muted>
      {rows.map((r) => (
        <SwitchRow
          key={r.part}
          label={r.label}
          sub={r.sub}
          value={on(r.part)}
          onChange={r.part !== 'products' && pick.products ? () => {} : flip(r.part)}
        />
      ))}
      {note ? <Text style={[st.note, note.ok && { color: colors.green }]}>{note.text}</Text> : null}
      <Button title={busy ? 'Clearing…' : 'Clear selected data'} kind="danger" icon="trash" onPress={go} disabled={busy} />
    </Card>
  );
}

const st = StyleSheet.create({
  note: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
