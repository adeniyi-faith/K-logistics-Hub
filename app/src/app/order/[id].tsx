import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../components/OrderCard';
import { Avatar, Button, Card, H2, Muted, Row, Screen, TopBar } from '../../components/ui';
import { clock, dayLabel, naira } from '../../lib/format';
import { itemsText, paymentText } from '../../lib/sales';
import { notSynced, orderTotal } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

/** "0803 111 2233" -> "2348031112233" for WhatsApp links. */
function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
}

/** One order. Once delivered, this is the proof: who delivered it, when, where and who received it. */
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const o = state.orders.find((x) => x.id === id);
  if (!o) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Order" back />
        <Screen>
          <Muted>This order was not found.</Muted>
        </Screen>
      </View>
    );
  }

  const rider = state.riders.find((r) => r.id === o.riderId);
  const delivered = o.status === 'delivered';
  const waiting = notSynced(state, o.id);
  const total = orderTotal(o);

  const share = () => {
    const text = [
      `K-Logistics Hub · Order #${o.code}`,
      `${o.customer}, ${o.area}`,
      itemsText(state, o),
      `Amount: ${naira(total)} (${paymentText(o)})`,
      delivered
        ? `Delivered ${dayLabel(o.day)} at ${clock(o.deliveredAt ?? '')} by ${rider?.name ?? 'rider'}, received by ${o.receivedBy ?? ''}.`
        : `Status: pending, rider ${rider?.name ?? ''}.`,
    ].join('\n');
    const to = o.phone ? waNumber(o.phone) : '';
    Linking.openURL(`https://wa.me/${to}?text=${encodeURIComponent(text)}`);
  };

  const steps: [string, string][] = [
    [`Order taken${o.takenBy ? ` by ${o.takenBy}` : ''}`, clock(o.createdAt)],
    [`Given to ${rider?.name.split(' ')[0] ?? 'rider'}`, clock(o.createdAt)],
  ];
  if (delivered) steps.push([`Delivered, received by ${o.receivedBy ?? '—'}`, clock(o.deliveredAt ?? '')]);
  steps.push([waiting ? 'Waiting to upload (saved on this phone)' : 'Uploaded', '']);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={delivered ? 'Delivery proof' : 'Order'} sub={`#${o.code} ${o.customer}`} back />
      <Screen
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Share on WhatsApp" kind="ghost" icon="share" onPress={share} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={`New order${rider ? ` with ${rider.name.split(' ')[0]}` : ''}`}
                kind="accent"
                onPress={() => router.push(`/new-sale?customer=${o.customerId}&rider=${o.riderId}`)}
              />
            </View>
          </View>
        }
      >
        <View style={[st.banner, { backgroundColor: delivered ? colors.greenBg : colors.orangeBg }]}>
          <Text style={[st.bannerText, { color: delivered ? colors.green : colors.orangeText }]}>
            {delivered ? `Delivered ${dayLabel(o.day)} at ${clock(o.deliveredAt ?? '')}` : `Pending · taken ${dayLabel(o.day)}`}
          </Text>
          <StatusBadge order={o} />
        </View>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Order</H2>
          <Row
            first
            title="Customer"
            right={o.customer}
            onPress={o.customerId ? () => router.push(`/customer/${o.customerId}`) : undefined}
          />
          <Row title="Area" right={o.area} />
          <Row title="Address" sub={o.address || '—'} />
          <Row title="Items" sub={itemsText(state, o)} />
          <Row title="Amount" right={naira(total)} sub={paymentText(o)} />
          {o.collected && o.collected.amount ? <Row title="Collected by rider" right={naira(o.collected.amount)} /> : null}
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2>{delivered ? 'Delivered by' : 'Rider'}</H2>
          <Row first lead={<Avatar initials={rider?.initials ?? '?'} />} title={rider?.name ?? 'No rider'} sub={rider?.bike} />
          {delivered ? <Row title="Received by" right={o.receivedBy ?? '—'} /> : null}
        </Card>

        <Card>
          <H2>Timeline</H2>
          {steps.map(([label, time], i) => (
            <View key={i} style={st.step}>
              <View style={st.dot} />
              <Text style={st.stepText}>{label}</Text>
              <Text style={st.stepTime}>{time}</Text>
            </View>
          ))}
        </Card>
        {delivered ? <Muted>Delivery photo and signature come in the next update.</Muted> : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  banner: { borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  bannerText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  stepText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.navy },
  stepTime: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
