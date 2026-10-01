import { View, StyleSheet } from 'react-native';

import { Text } from './Text';

import { Order } from '../data/types';
import { count, naira } from '../lib/format';
import { orderTotal } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { orderFor } from '../lib/sales';
import { Badge, Muted } from './ui';

export function OrderSummary({ order }: { order: Order }) {
  const { state } = useStore();
  const name = new Map(state.products.map((p) => [p.id, p]));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Muted>#{order.code}</Muted>
        <Badge kind={order.status === 'delivered' ? 'green' : 'amber'}>
          {order.status === 'delivered' ? 'Delivered' : 'Pending'}
        </Badge>
      </View>
      <Text style={st.customer}>{orderFor(order)}</Text>
      <Muted>{order.address}</Muted>
      {order.items.map((it) => {
        const p = name.get(it.productId);
        return (
          <Text key={it.productId} style={st.item}>
            {p?.name} × {count(it.qty, p?.unit ?? 'unit')}
          </Text>
        );
      })}
      <Text style={st.collect}>
        {order.payment === 'on_delivery' ? `Collect ${naira(orderTotal(order))}` : 'Paid by transfer'}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  customer: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  item: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.navy },
  collect: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.orangeText },
});
