import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

type Tab = 'all' | 'delivered';

export default function Sales() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { state } = useStore();
  const { canEdit } = useAccess();
  const w = useWords();
  const [tab, setTab] = useState<Tab>(params.tab === 'delivered' ? 'delivered' : 'all');
  const [rider, setRider] = useState('all');

  // Opening this tab with ?tab=delivered (e.g. from the home screen) shows Delivered.
  useEffect(() => {
    if (params.tab === 'delivered' || params.tab === 'all') setTab(params.tab);
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
            { value: 'all', label: 'All orders' },
            { value: 'delivered', label: 'Delivered' },
          ]}
        />
        {tab === 'all' ? <AllOrders rider={rider} chips={riderChips} /> : <Delivered rider={rider} chips={riderChips} />}
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

/** Every delivered order, to settle "it wasn't delivered" calls. */
function Delivered({ rider, chips }: { rider: string; chips: React.ReactNode }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = state.orders
    .filter((o) => o.status === 'delivered' && (rider === 'all' || o.riderId === rider))
    .filter(
      (o) =>
        !term ||
        [o.customer, o.phone.replace(/\s/g, ''), o.area, o.code].some((f) => f.toLowerCase().includes(term.replace(/^#/, ''))),
    )
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''));
  const days = [...new Set(list.map((o) => o.day))];
  return (
    <>
      <View style={st.search}>
        <Icon name="search" color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Customer, phone, area or order number"
          placeholderTextColor="#8A93A6"
          style={st.searchInput}
          accessibilityLabel="Search delivered orders"
        />
      </View>
      <Muted>
        Customer says an order wasn't delivered? Search here. Every delivered order shows who delivered it, when, where and who
        received it.
      </Muted>
      {chips}
      {days.length === 0 ? <Muted>No delivered orders match.</Muted> : null}
      {days.map((d) => {
        const ofDay = list.filter((o) => o.day === d);
        return (
          <View key={d} style={{ gap: 8 }}>
            <Text style={st.day}>
              {dayLabel(d)}
              {d === state.day ? ' · Today' : ''} · {ofDay.length} delivered
            </Text>
            <Card style={{ paddingVertical: 4 }}>
              {ofDay.map((o, i) => (
                <OrderCard key={o.id} order={o} first={i === 0} showReceiver />
              ))}
            </Card>
          </View>
        );
      })}
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
