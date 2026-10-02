import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, Button, Card, H2, Muted, Row, Screen, Stat, SyncPill, ViewingBar } from '../../components/ui';
import { OrderSummary } from '../../components/OrderSummary';
import { clock, naira } from '../../lib/format';
import { deliveredOn, orderTotal, riderDay } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { orderFor } from '../../lib/sales';
import { colors, fonts } from '../../theme';

export default function RiderDeliveries() {
  const { state } = useStore();
  const riderId = state.session?.riderId ?? '';
  const rider = state.riders.find((r) => r.id === riderId);
  const day = riderDay(state, riderId);
  // Every pending delivery (including ones carried over from earlier days), plus what was done today.
  const mine = state.orders.filter((o) => o.riderId === riderId && (o.status === 'pending' || deliveredOn(o) === state.day));
  const pending = mine.filter((o) => o.status === 'pending');
  const done = mine.filter((o) => o.status !== 'pending');
  const [next, ...later] = pending;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.white }}>
        <View style={st.head}>
          <Avatar initials={rider?.initials ?? '?'} />
          <View style={{ flex: 1 }}>
            <Text style={st.hi}>Hi, {rider?.name.split(' ')[0] ?? state.session?.name ?? ''}</Text>
            <Muted>{rider?.bike}</Muted>
          </View>
          <SyncPill />
        </View>
        <ViewingBar />
      </SafeAreaView>
      <Screen>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Assigned" value={String(day.assigned)} />
          <Stat label="Delivered" value={String(day.delivered)} />
          <Stat label="Left" value={String(day.left)} />
        </View>
        <View style={st.earned}>
          <Text style={st.earnedText}>Earned today: {naira(day.earned)}</Text>
        </View>

        {next ? (
          <Card>
            <H2>Next delivery</H2>
            <OrderSummary order={next} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Call"
                  kind="ghost"
                  icon="phone"
                  onPress={() => Linking.openURL(`tel:${next.phone.replace(/\s/g, '')}`)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Directions"
                  kind="ghost"
                  icon="nav"
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(next.address)}`)}
                />
              </View>
            </View>
            <Button title="Confirm delivery" kind="accent" onPress={() => router.push(`/delivery/${next.id}`)} />
          </Card>
        ) : (
          <Card>
            <H2>All done</H2>
            <Muted>You have no deliveries left today.</Muted>
          </Card>
        )}

        {later.length ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2>Later today</H2>
            {later.map((o, i) => (
              <Row
                key={o.id}
                first={i === 0}
                title={orderFor(o)}
                sub={`#${o.code} · ${o.area}`}
                right={o.payment === 'on_delivery' ? `Collect ${naira(orderTotal(o))}` : 'Paid'}
                rightSub={<Badge kind="amber">Pending</Badge>}
                onPress={() => router.push(`/delivery/${o.id}`)}
              />
            ))}
          </Card>
        ) : null}

        {done.length ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2>Done today</H2>
            {done.map((o, i) => (
              <Row
                key={o.id}
                first={i === 0}
                title={orderFor(o)}
                sub={`${o.deliveredAt ? clock(o.deliveredAt) : ''} · ${o.area}`}
                rightSub={o.status === 'delivered' ? <Badge kind="green">Delivered</Badge> : <Badge kind="red">Failed</Badge>}
              />
            ))}
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  hi: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  earned: { backgroundColor: colors.greenBg, borderRadius: 12, padding: 12 },
  earnedText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.green },
});
