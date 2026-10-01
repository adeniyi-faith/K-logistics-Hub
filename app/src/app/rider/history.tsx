import { View } from 'react-native';

import { Badge, Card, H2, Muted, Row, Screen, Stat, TopBar } from '../../components/ui';
import { clock, dayLabel, naira } from '../../lib/format';
import { deliveredOn, riderDay } from '../../lib/stock';
import { orderFor } from '../../lib/sales';
import { useStore } from '../../store/AppStore';

export default function RiderHistory() {
  const { state } = useStore();
  const riderId = state.session?.riderId ?? '';
  const mine = state.orders
    .filter((o) => o.riderId === riderId && o.status !== 'pending')
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''));
  const days = [...new Set(mine.map(deliveredOn))];
  const totals = days.map((d) => ({ day: d, ...riderDay(state, riderId, d) }));
  const name = new Map(state.products.map((p) => [p.id, p.name]));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="My deliveries" />
      <Screen>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Delivered" value={String(totals.reduce((s, t) => s + t.delivered, 0))} />
          <Stat label="Failed" value={String(totals.reduce((s, t) => s + t.failed, 0))} />
          <Stat label="Earned" value={naira(totals.reduce((s, t) => s + t.earned, 0))} />
        </View>

        <Card style={{ paddingVertical: 8 }}>
          <H2>My earnings</H2>
          {totals.length === 0 ? <Muted>No deliveries yet.</Muted> : null}
          {totals.map((t, i) => (
            <Row key={t.day} first={i === 0} title={dayLabel(t.day)} sub={`${t.delivered} deliveries`} right={naira(t.earned)} />
          ))}
        </Card>

        {days.map((d) => (
          <Card key={d} style={{ paddingVertical: 8 }}>
            <H2>{dayLabel(d)}</H2>
            {mine
              .filter((o) => deliveredOn(o) === d)
              .map((o, i) => (
                <Row
                  key={o.id}
                  first={i === 0}
                  title={`${o.deliveredAt ? clock(o.deliveredAt) : ''} ${orderFor(o)}`}
                  sub={o.items.map((it) => `${name.get(it.productId)} × ${it.qty}`).join(', ')}
                  rightSub={o.status === 'delivered' ? <Badge kind="green">Delivered</Badge> : <Badge kind="red">Failed</Badge>}
                />
              ))}
          </Card>
        ))}
      </Screen>
    </View>
  );
}
