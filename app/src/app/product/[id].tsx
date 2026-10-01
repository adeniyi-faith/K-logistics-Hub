import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, H2, LinkText, Muted, Row, Screen, TopBar } from '../../components/ui';
import { count, naira } from '../../lib/format';
import { stockFor } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const p = state.products.find((x) => x.id === id);
  if (!p) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Product" back />
        <Screen>
          <Muted>This product was not found.</Muted>
        </Screen>
      </View>
    );
  }

  const line = stockFor(state, p.id);
  const profitEach = p.sellPrice - p.costPrice;
  const margin = p.sellPrice ? (profitEach / p.sellPrice) * 100 : 0;
  const latest = state.moves
    .filter((m) => m.productId === p.id && m.kind === 'received' && m.expiry)
    .sort((a, b) => (a.expiry ?? '').localeCompare(b.expiry ?? ''))[0];

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={p.name} sub={`${p.group} · ${p.pack}`} back />
      <Screen
        footer={
          <Button title="Receive stock" kind="accent" icon="plus" onPress={() => router.push(`/receive-stock?product=${p.id}`)} />
        }
      >
        <Card>
          <H2>Today's stock</H2>
          <Muted>Worked out for you</Muted>
          <View style={st.sum}>
            <Part label="OPENING" value={line.opening} />
            <Text style={st.op}>+</Text>
            <Part label="RECEIVED" value={line.received} />
            <Text style={st.op}>−</Text>
            <Part label="DELIVERED" value={line.delivered} />
            <Text style={st.op}>=</Text>
            <Part label="CLOSING" value={line.closing} strong />
          </View>
          <Muted>Tonight's closing stock ({line.closing}) becomes tomorrow's opening stock.</Muted>
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2
            right={
              state.session?.role === 'admin' ? (
                <LinkText onPress={() => router.push(`/edit-prices?product=${p.id}`)}>Edit prices</LinkText>
              ) : undefined
            }
          >
            Price & profit
          </H2>
          <Row first title="Cost price" right={`${naira(p.costPrice)} per ${p.unit}`} />
          <Row title="Selling price" right={`${naira(p.sellPrice)} per ${p.unit}`} />
          <Row title={`Profit per ${p.unit}`} sub={`${margin.toFixed(1)}% margin`} right={naira(profitEach)} />
          <Row title="Profit today" sub={`${count(line.delivered, p.unit)} sold`} right={naira(profitEach * line.delivered)} />
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Product info</H2>
          <Row first title="NAFDAC reg. no." right={p.nafdac} />
          <Row title="Supplier" right={p.supplier} />
          <Row title="Nearest expiry" right={latest ? `${latest.expiry} · batch ${latest.batch}` : 'Not recorded'} />
          <Row title="Warn me below" right={count(p.lowAt, p.unit)} />
        </Card>
      </Screen>
    </View>
  );
}

function Part({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={st.partLabel}>{label}</Text>
      <Text style={[st.partValue, strong && { color: colors.orangeText }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  sum: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 8 },
  op: { fontFamily: fonts.head, fontSize: 18, color: colors.muted, paddingBottom: 2 },
  partLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted, letterSpacing: 0.4 },
  partValue: { fontFamily: fonts.head, fontSize: 22, color: colors.navy },
});
