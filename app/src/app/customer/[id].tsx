import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { StatusBadge } from '../../components/OrderCard';
import { Avatar, Button, Card, H2, Muted, Row, Screen, TopBar } from '../../components/ui';
import { count, dayLabel, naira } from '../../lib/format';
import { customerStats, itemsText } from '../../lib/sales';
import { orderTotal } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { useAccess } from '../../lib/useAccess';
import { DeleteButton } from '../../components/DeleteButton';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CustomerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteCustomer } = useStore();
  const { canEdit, isAdmin } = useAccess();
  const c = state.customers.find((x) => x.id === id);
  if (!c) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Customer" back />
        <Screen>
          <Muted>This customer was not found.</Muted>
        </Screen>
      </View>
    );
  }

  const s = customerStats(state, c.id);
  const usual = s.usualRider ? state.riders.find((r) => r.id === s.usualRider) : null;
  const since = c.since ? `Customer since ${MONTHS[Number(c.since.slice(5, 7)) - 1]} ${c.since.slice(0, 4)}` : undefined;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={c.name} sub={since} back />
      <Screen>
        <Card style={{ gap: 6 }}>
          <Text style={st.big}>{c.phone}</Text>
          <Muted>
            {c.area}
            {c.address ? ` · ${c.address}` : ''}
          </Muted>
          <View style={st.stats}>
            <Fig label="TOTAL BOUGHT" value={naira(s.total)} />
            <Fig label="ORDERS" value={String(s.orders.length)} />
            <Fig label="LAST ORDER" value={s.lastOrder ? dayLabel(s.lastOrder).slice(0, 5) : '—'} />
          </View>
        </Card>

        {usual ? (
          <Card>
            <Row
              first
              lead={<Avatar initials={usual.initials} />}
              title={`Usually delivered by ${usual.name}`}
              sub={`${s.usualCount} of ${s.deliveredCount} deliveries${s.lastDeliveredDay ? ` · last on ${dayLabel(s.lastDeliveredDay)}` : ''}`}
            />
            {canEdit('sales') ? (
              <Button
                title={`New order with ${usual.name.split(' ')[0]}`}
                kind="accent"
                onPress={() => router.push(`/new-sale?customer=${c.id}&rider=${usual.id}`)}
              />
            ) : null}
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Call"
              kind="ghost"
              icon="phone"
              onPress={() => Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`)}
              disabled={!c.phone}
            />
          </View>
          {canEdit('sales') ? (
            <View style={{ flex: 1 }}>
              <Button title="New order" kind="ghost" icon="plus" onPress={() => router.push(`/new-sale?customer=${c.id}`)} />
            </View>
          ) : null}
        </View>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Delivery history</H2>
          {s.orders.length === 0 ? <Muted>No orders yet.</Muted> : null}
          {s.orders.map((o, i) => {
            const r = state.riders.find((x) => x.id === o.riderId);
            return (
              <Row
                key={o.id}
                first={i === 0}
                title={dayLabel(o.day)}
                sub={`${itemsText(state, o)} · ${naira(orderTotal(o))}\n${r ? `${r.name.split(' ')[0]} · ${r.bike.split(' · ')[0]} · ` : ''}${o.area}`}
                rightSub={<StatusBadge order={o} />}
                onPress={() => router.push(`/order/${o.id}`)}
              />
            );
          })}
        </Card>

        {s.mostBought.length ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2>Most bought</H2>
            {s.mostBought.map(([productId, b], i) => {
              const p = state.products.find((x) => x.id === productId);
              return (
                <Row
                  key={productId}
                  first={i === 0}
                  title={p?.name ?? 'Product'}
                  sub={count(b.qty, p?.unit ?? 'unit')}
                  right={naira(b.value)}
                />
              );
            })}
          </Card>
        ) : null}
        {isAdmin ? (
          <DeleteButton
            title="Delete this customer"
            question={`Delete ${c.name}?`}
            message={`${c.name} will be removed from the customer list on every phone. Their past orders stay in the records with their name. This can't be undone.`}
            remove={() => deleteCustomer(c.id)}
          />
        ) : null}
      </Screen>
    </View>
  );
}

function Fig({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={st.figLabel}>{label}</Text>
      <Text style={st.figValue}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  big: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  stats: { flexDirection: 'row', gap: 10, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  figLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted, letterSpacing: 0.4 },
  figValue: { fontFamily: fonts.head, fontSize: 16, color: colors.navy },
});
