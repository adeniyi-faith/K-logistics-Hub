import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { Order } from '../data/types';
import { clock, naira } from '../lib/format';
import { itemsText, orderFor, paymentText } from '../lib/sales';
import { orderTotal } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Badge } from './ui';

export function StatusBadge({ order }: { order: Order }) {
  if (order.status === 'delivered') return <Badge kind="green">Delivered</Badge>;
  if (order.status === 'failed') return <Badge kind="red">Failed</Badge>;
  return <Badge kind="amber">Pending</Badge>;
}

/** One order in a list: number, time, status, customer, items, amount, rider and payment. */
export function OrderCard({ order, first, showReceiver }: { order: Order; first?: boolean; showReceiver?: boolean }) {
  const { state } = useStore();
  const rider = state.riders.find((r) => r.id === order.riderId);
  const time = order.status === 'delivered' && order.deliveredAt ? order.deliveredAt : order.createdAt;
  return (
    <Pressable
      onPress={() => router.push(`/order/${order.id}`)}
      accessibilityRole="button"
      style={({ pressed }) => [st.wrap, !first && st.border, pressed && { opacity: 0.7 }]}
    >
      <View style={st.line}>
        <Text style={st.code}>
          Order #{order.code} · {clock(time)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <StatusBadge order={order} />
        </View>
      </View>
      <View style={st.line}>
        <Text style={st.customer} numberOfLines={1}>
          {orderFor(order)}
        </Text>
        <Text style={st.amount}>{naira(orderTotal(order))}</Text>
      </View>
      <Text style={st.sub}>
        {order.area} · {itemsText(state, order)}
      </Text>
      <View style={st.line}>
        <Text style={st.sub}>
          {rider ? `${rider.name.split(' ')[0]} · ${rider.bike.split(' · ')[0]}` : 'No rider'}
          {showReceiver && order.receivedBy ? ` · received by ${order.receivedBy}` : ''}
        </Text>
        <Text style={st.sub}>{paymentText(order)}</Text>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  wrap: { paddingVertical: 12, gap: 4 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  customer: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  amount: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, flexShrink: 1 },
});
