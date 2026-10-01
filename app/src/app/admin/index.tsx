import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { IconName } from '../../components/icons';
import { Card, H2, LinkText, Row, Screen, Stat, TopBar } from '../../components/ui';
import { greeting, longDay, naira } from '../../lib/format';
import { dayMoney, isLow, orderUnits, stockFor } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

export default function AdminHome() {
  const { state } = useStore();
  const money = dayMoney(state);

  const lines = state.products.map((p) => ({ p, line: stockFor(state, p.id) }));
  const inStore = lines.reduce((s, x) => s + x.line.closing, 0);
  const received = lines.reduce((s, x) => s + x.line.received, 0);
  const deliveredUnits = lines.reduce((s, x) => s + x.line.delivered, 0);
  const low = lines.filter((x) => isLow(x.p, x.line));

  const todays = state.orders.filter((o) => o.day === state.day);
  const delivered = todays.filter((o) => o.status === 'delivered');
  const pending = todays.filter((o) => o.status === 'pending');
  const customersServed = new Set(delivered.map((o) => o.customer)).size;
  const ridersOut = new Set(pending.map((o) => o.riderId)).size;

  return (
    <View style={{ flex: 1 }}>
      <TopBar sub={longDay(state.day)} title={`${greeting()}, ${state.session?.name ?? ''}`} />
      <Screen>
        <View style={st.hero}>
          <Text style={st.heroLabel}>Today's sales</Text>
          <Text style={st.heroValue}>{naira(money.sales)}</Text>
          <Text style={st.heroSub}>{money.salesCount} sales</Text>
          <View style={st.heroRow}>
            <HeroBit label="Cost of goods" value={naira(money.costOfGoods)} />
            <HeroBit label="Expenses" value={naira(money.expenses)} />
            <HeroBit label="Profit" value={naira(money.profit)} highlight />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Quick icon="plus" label="New sale" soon />
          <Quick icon="box" label="Receive stock" onPress={() => router.push('/receive-stock')} />
          <Quick icon="receipt" label="Add expense" soon />
          <Quick icon="check" label="Delivered" soon />
        </View>

        <Card>
          <H2>Today's overview</H2>
          <View style={st.grid}>
            <Stat label="Products delivered" value={`${deliveredUnits} units`} />
            <Stat label="Customers served" value={String(customersServed)} />
          </View>
          <View style={st.grid}>
            <Stat label="Pending deliveries" value={String(pending.length)} />
            <Stat label="Delivered orders" value={String(delivered.length)} note={`${delivered.reduce((s, o) => s + orderUnits(o), 0)} units`} />
          </View>
        </Card>

        <Card>
          <H2 right={<LinkText onPress={() => router.push('/admin/stock')}>See stock</LinkText>}>Inventory</H2>
          <Row first title="Current stock" sub="Units in store" right={`${inStore} units`} />
          <Row
            title="Low stock"
            sub={low.length ? low.map((x) => x.p.name).join(', ') : 'Nothing is running low'}
            right={String(low.length)}
            rightSub={null}
          />
          <Row title="Received today" right={`${received} units`} />
          <Row title="Delivered today" right={`${deliveredUnits} units`} />
        </Card>

        <Card>
          <H2>Operations</H2>
          <View style={st.grid}>
            <Stat label="Completed" value={String(delivered.length)} noteColor={colors.green} />
            <Stat label="Pending" value={String(pending.length)} />
          </View>
          <Text style={st.muted}>
            {ridersOut} of {state.riders.length} riders out
          </Text>
        </Card>
      </Screen>
    </View>
  );
}

function HeroBit({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={st.heroBitLabel}>{label}</Text>
      <Text style={[st.heroBitValue, highlight && { color: '#7FE0A6' }]}>{value}</Text>
    </View>
  );
}

function Quick({ icon, label, onPress, soon }: { icon: IconName; label: string; onPress?: () => void; soon?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={soon}
      accessibilityRole="button"
      accessibilityLabel={soon ? `${label} (coming soon)` : label}
      style={[st.quick, soon && { opacity: 0.5 }]}
    >
      <View style={st.quickIcon}>
        <Icon name={icon} size={20} color={colors.orangeText} />
      </View>
      <Text style={st.quickLabel}>{label}</Text>
      {soon ? <Text style={st.soon}>Soon</Text> : null}
    </Pressable>
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: 20, padding: 18, gap: 4 },
  heroLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#C9D3E6' },
  heroValue: { fontFamily: fonts.head, fontSize: 32, color: colors.white },
  heroSub: { fontFamily: fonts.body, fontSize: 13, color: '#C9D3E6' },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A3D66' },
  heroBitLabel: { fontFamily: fonts.body, fontSize: 12, color: '#C9D3E6' },
  heroBitValue: { fontFamily: fonts.head, fontSize: 14, color: colors.white },
  grid: { flexDirection: 'row', gap: 10 },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  quickIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.orangeBg, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.navy, textAlign: 'center' },
  soon: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
