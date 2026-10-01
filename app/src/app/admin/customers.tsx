import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Card, Chips, Field, Muted, Row, Screen, Stat, TopBar } from '../../components/ui';
import { dayLabel } from '../../lib/format';
import { useStore } from '../../store/AppStore';

type Filter = 'all' | 'week';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export default function Customers() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const weekAgo = new Date(`${state.day}T12:00:00`);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);

  const lastOrder = new Map<string, string>();
  for (const o of state.orders) {
    if (o.day > (lastOrder.get(o.customerId) ?? '')) lastOrder.set(o.customerId, o.day);
  }
  const thisWeek = state.customers.filter((c) => (lastOrder.get(c.id) ?? '') >= weekStart);

  const term = q.trim().toLowerCase();
  const list = (filter === 'week' ? thisWeek : state.customers)
    .filter((c) => !term || [c.name, c.phone.replace(/\s/g, ''), c.area].some((f) => f.toLowerCase().includes(term)))
    .sort((a, b) => (lastOrder.get(b.id) ?? '').localeCompare(lastOrder.get(a.id) ?? '') || a.name.localeCompare(b.name));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Customers" />
      <Screen>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Customers" value={String(state.customers.length)} />
          <Stat label="Ordered this week" value={String(thisWeek.length)} />
        </View>
        <Field label="Search" placeholder="Name, phone or area" value={q} onChangeText={setQ} />
        <Chips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'week', label: 'This week' },
          ]}
        />
        <Card style={{ paddingVertical: 4 }}>
          {list.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No customers match.</Muted> : null}
          {list.map((c, i) => (
            <Row
              key={c.id}
              first={i === 0}
              lead={<Avatar initials={initials(c.name)} />}
              title={c.name}
              sub={`${c.area} · ${c.phone}`}
              rightSub={
                <Muted>{lastOrder.has(c.id) ? `Last order ${dayLabel(lastOrder.get(c.id)!).slice(0, 5)}` : 'No orders'}</Muted>
              }
              onPress={() => router.push(`/customer/${c.id}`)}
            />
          ))}
        </Card>
      </Screen>
    </View>
  );
}
