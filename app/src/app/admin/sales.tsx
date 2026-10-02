import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '../../components/Text';

import { Icon } from '../../components/Icon';
import { OrderCard } from '../../components/OrderCard';
import { Button, Card, Chips, Muted, Screen, Stat, TopBar } from '../../components/ui';
import { dayLabel, longDay, naira } from '../../lib/format';
import { byNewest } from '../../lib/sales';
import { orderTotal } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { useAccess } from '../../lib/useAccess';
import { useWords } from '../../lib/words';

type Tab = 'today' | 'find';
const STATUSES = ['all', 'pending', 'delivered', 'failed'];

export default function Sales() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { state } = useStore();
  const { canEdit } = useAccess();
  const w = useWords();
  // ?tab=delivered (e.g. from the home screen) opens Find orders showing delivered ones.
  const pick = (t?: string): Tab => (t && t !== 'all' && t !== 'today' ? 'find' : 'today');
  const status = (STATUSES.includes(params.tab ?? '') ? params.tab : 'all') as Status;
  const [tab, setTab] = useState<Tab>(pick(params.tab));
  const [rider, setRider] = useState('all');

  useEffect(() => {
    if (params.tab) setTab(pick(params.tab));
  }, [params.tab]);

  const riderChips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Chips
        value={rider}
        onChange={setRider}
        options={[
          { value: 'all', label: `All ${w.riders}` },
          ...state.riders.map((r) => ({ value: r.id, label: r.name.split(' ')[0] })),
        ]}
      />
    </ScrollView>
  );

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`${w.Sales} & deliveries`} />
      <Screen
        footer={
          canEdit('sales') ? (
            <Button title={`New ${w.sale}`} kind="accent" icon="plus" onPress={() => router.push('/new-sale')} />
          ) : undefined
        }
      >
        <Chips
          full
          value={tab}
          onChange={setTab}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'find', label: 'Find orders' },
          ]}
        />
        {tab === 'today' ? (
          <AllOrders rider={rider} chips={riderChips} />
        ) : (
          <FindOrders rider={rider} chips={riderChips} status={status} />
        )}
      </Screen>
    </View>
  );
}

function AllOrders({ rider, chips }: { rider: string; chips: React.ReactNode }) {
  const { state } = useStore();
  const todays = state.orders.filter((o) => o.day === state.day && (rider === 'all' || o.riderId === rider)).sort(byNewest);
  const live = todays.filter((o) => o.status !== 'failed');
  const delivered = todays.filter((o) => o.status === 'delivered').length;
  return (
    <>
      <Text style={st.day}>Today, {longDay(state.day)}</Text>
      {chips}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="Orders" value={String(todays.length)} />
        <Stat label="Value" value={naira(live.reduce((s, o) => s + orderTotal(o), 0))} />
        <Stat label="Delivered" value={String(delivered)} note={`${todays.length - delivered} pending`} />
      </View>
      <Card style={{ paddingVertical: 4 }}>
        {todays.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No orders yet today.</Muted> : null}
        {todays.map((o, i) => (
          <OrderCard key={o.id} order={o} first={i === 0} />
        ))}
      </Card>
    </>
  );
}

type Status = 'all' | 'pending' | 'delivered' | 'failed';

/** Shown at once; more matches load with "Show more" so long histories stay quick. */
const PAGE = 60;

/** Find any order by number, customer, phone, area, item or rider, e.g. to settle "it wasn't delivered" calls. */
function FindOrders({ rider, chips, status: start }: { rider: string; chips: React.ReactNode; status: Status }) {
  const { state } = useStore();
  const w = useWords();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>(start);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setStatus(start), [start]);
  useEffect(() => setShown(PAGE), [q, status, rider]);

  const names = useMemo(() => new Map(state.products.map((p) => [p.id, p.name.toLowerCase()])), [state.products]);
  const riderNames = useMemo(() => new Map(state.riders.map((r) => [r.id, r.name.toLowerCase()])), [state.riders]);
  const words = q.trim().toLowerCase().replace(/^#/, '').split(/\s+/).filter(Boolean);
  const list = state.orders
    .filter((o) => (status === 'all' || o.status === status) && (rider === 'all' || o.riderId === rider))
    .filter((o) => {
      if (!words.length) return true;
      const text = [
        o.code,
        o.customer,
        o.phone,
        o.phone.replace(/\s/g, ''),
        o.area,
        o.address ?? '',
        riderNames.get(o.riderId) ?? '',
        ...o.items.map((it) => names.get(it.productId) ?? ''),
      ]
        .join(' ')
        .toLowerCase();
      // Every word typed must match somewhere, e.g. "ada tea" finds Ada's orders with tea in them.
      return words.every((x) => text.includes(x));
    })
    .sort((a, b) => b.day.localeCompare(a.day) || byNewest(a, b));
  const page = list.slice(0, shown);
  const days = [...new Set(page.map((o) => o.day))];
  const what =
    status === 'delivered' ? 'delivered' : status === 'failed' ? 'not delivered' : status === 'pending' ? 'pending' : '';

  return (
    <>
      <View style={st.search}>
        <Icon name="search" color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Order no., customer, phone, item"
          placeholderTextColor="#8A93A6"
          style={st.searchInput}
          accessibilityLabel="Search orders"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chips<Status>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'pending', label: 'Pending' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: "Couldn't deliver" },
          ]}
        />
      </ScrollView>
      {chips}
      <Muted>
        {list.length
          ? `${list.length} ${what} ${list.length === 1 ? w.sale : w.sales} found.`.replace('  ', ' ')
          : `No ${what} ${w.sales} match.`.replace('  ', ' ')}{' '}
        Delivered orders show who delivered them, when, where and who received them.
      </Muted>
      {days.map((d) => {
        const ofDay = page.filter((o) => o.day === d);
        return (
          <View key={d} style={{ gap: 8 }}>
            <Text style={st.day}>
              {dayLabel(d)}
              {d === state.day ? ' · Today' : ''} · {ofDay.length}
            </Text>
            <Card style={{ paddingVertical: 4 }}>
              {ofDay.map((o, i) => (
                <OrderCard key={o.id} order={o} first={i === 0} showReceiver />
              ))}
            </Card>
          </View>
        );
      })}
      {list.length > shown ? (
        <Button title={`Show more (${list.length - shown} left)`} kind="ghost" onPress={() => setShown(shown + PAGE)} />
      ) : null}
    </>
  );
}

const st = StyleSheet.create({
  day: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.navy, minHeight: 44 },
});
