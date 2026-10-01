import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Chips, Muted, Row, Screen, Stat, TopBar } from '../../components/ui';
import { clock, count, dayLabel } from '../../lib/format';
import { isLow, notSynced, stockFor } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

type Tab = 'store' | 'received';

export default function Stock() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('store');
  const [filter, setFilter] = useState('all');

  const lines = state.products.map((p) => ({ p, line: stockFor(state, p.id) }));
  const low = lines.filter((x) => isLow(x.p, x.line));
  const groups = [...new Set(state.products.map((p) => p.group))];
  const shown = lines
    .filter((x) => (filter === 'all' ? true : filter === 'low' ? isLow(x.p, x.line) : x.p.group === filter))
    .sort((a, b) => b.line.delivered - a.line.delivered || a.p.name.localeCompare(b.p.name));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Stock" />
      <Screen footer={<Button title="Receive stock" kind="accent" icon="plus" onPress={() => router.push('/receive-stock')} />}>
        <Chips
          full
          value={tab}
          onChange={setTab}
          options={[
            { value: 'store', label: 'In store' },
            { value: 'received', label: 'Received' },
          ]}
        />

        {tab === 'store' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chips
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: `All (${lines.length})` },
                  { value: 'low', label: `Low stock (${low.length})` },
                  ...groups.map((g) => ({ value: g, label: g })),
                ]}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Stat label="Received" value={`+${lines.reduce((s, x) => s + x.line.received, 0)}`} />
              <Stat label="Delivered" value={`−${lines.reduce((s, x) => s + x.line.delivered, 0)}`} />
              <Stat label="In store now" value={String(lines.reduce((s, x) => s + x.line.closing, 0))} />
            </View>

            <Card style={{ paddingVertical: 4 }}>
              {shown.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No products here.</Muted> : null}
              {shown.map(({ p, line }, i) => (
                <Row
                  key={p.id}
                  first={i === 0}
                  title={p.name}
                  sub={`Open ${line.opening} · In +${line.received} · Out −${line.delivered}`}
                  right={count(line.closing, p.unit)}
                  rightSub={isLow(p, line) ? <Badge kind="amber">Low stock</Badge> : <Badge kind="green">In stock</Badge>}
                  onPress={() => router.push(`/product/${p.id}`)}
                />
              ))}
            </Card>
          </>
        ) : (
          <Received />
        )}
      </Screen>
    </View>
  );
}

/** Every delivery of stock on one page, grouped under its date. */
function Received() {
  const { state } = useStore();
  const name = new Map(state.products.map((p) => [p.id, p]));
  const received = state.moves.filter((m) => m.kind === 'received').sort((a, b) => b.at.localeCompare(a.at));
  const days = [...new Set(received.map((m) => m.day))];
  if (!received.length) return <Muted>No stock received yet.</Muted>;
  return (
    <>
      {days.map((day) => (
        <View key={day} style={{ gap: 8 }}>
          <Text style={st.day}>{dayLabel(day)}</Text>
          <Card style={{ paddingVertical: 4 }}>
            {received
              .filter((m) => m.day === day)
              .map((m, i) => {
                const p = name.get(m.productId);
                return (
                  <Row
                    key={m.id}
                    first={i === 0}
                    title={p?.name ?? 'Product'}
                    sub={[m.batch && `Batch ${m.batch}`, m.expiry && `Expires ${m.expiry}`, `${clock(m.at)} · by ${m.by}`]
                      .filter(Boolean)
                      .join(' · ')}
                    right={`+${m.qty}`}
                    rightSub={notSynced(state, m.id) ? <Badge kind="amber">Not synced</Badge> : null}
                  />
                );
              })}
          </Card>
        </View>
      ))}
    </>
  );
}

const st = StyleSheet.create({
  day: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
});
