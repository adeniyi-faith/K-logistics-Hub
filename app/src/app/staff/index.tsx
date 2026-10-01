import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { Icon } from '../../components/Icon';
import { IconName } from '../../components/icons';
import { Avatar, Badge, Card, H2, IconTile, LinkText, Row, Screen, Stat, TopBar } from '../../components/ui';
import { Area } from '../../data/access';
import { count, greeting, longDay } from '../../lib/format';
import { riderNow } from '../../lib/riders';
import { deliveredOn, isLow, riderDay, stockFor } from '../../lib/stock';
import { useAccess } from '../../lib/useAccess';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { useWords } from '../../lib/words';

/** Areas that aren't tabs, opened from the home screen. */
const OTHER: { area: Area; icon: IconName; title: string; sub: string; href: string }[] = [
  { area: 'riders', icon: 'bike', title: 'Riders & bikes', sub: 'Riders, bikes and earnings', href: '/riders' },
  { area: 'expenses', icon: 'receipt', title: 'Expenses', sub: 'Fuel, repairs, packaging', href: '/expenses' },
  { area: 'staffpay', icon: 'users', title: 'Staff & pay', sub: 'Salaries and payments', href: '/staff-pay' },
  { area: 'finance', icon: 'chart', title: 'Finance', sub: 'Profit by day, week and month', href: '/finance' },
  { area: 'reports', icon: 'file', title: 'Reports', sub: 'Filter and look back', href: '/reports' },
  { area: 'settings', icon: 'sliders', title: 'Business settings', sub: 'Logo, lists and words', href: '/settings' },
];

/** Staff home, built from what this person may use. */
export default function StaffHome() {
  const { state } = useStore();
  const { canView, canEdit, can } = useAccess();
  const w = useWords();

  const doneToday = state.orders.filter((o) => o.status === 'delivered' && deliveredOn(o) === state.day).length;
  const pending = state.orders.filter((o) => o.status === 'pending').length;
  const total = doneToday + pending;
  const lines = state.products.map((p) => ({ p, line: stockFor(state, p.id) }));
  const quick = [
    canEdit('sales') && { icon: 'plus' as const, label: `New ${w.sale}`, href: '/new-sale' },
    canEdit('stock') && { icon: 'box' as const, label: 'Receive stock', href: '/receive-stock' },
    canView('customers') && { icon: 'users' as const, label: 'Customers', href: '/staff/customers' },
    canEdit('expenses') && { icon: 'receipt' as const, label: 'Add expense', href: '/add-expense' },
  ].filter(Boolean) as { icon: IconName; label: string; href: string }[];
  const other = OTHER.filter((o) => (o.area === 'settings' ? canEdit(o.area) : canView(o.area))).map((o) =>
    o.area === 'riders' ? { ...o, title: `${w.Riders} & bikes`, sub: `${w.Riders}, bikes and earnings` } : o,
  );
  const hidden = (['finance', 'staffpay', 'expenses'] as Area[]).filter((a) => !canView(a));

  return (
    <View style={{ flex: 1 }}>
      <TopBar sub={longDay(state.day)} title={`${greeting()}, ${state.session?.name ?? ''}`} />
      <Screen>
        {canView('sales') ? (
          <Card>
            <Text style={st.label}>Today's deliveries</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={st.big}>
                {doneToday} of {total}
              </Text>
              <Text style={st.muted}>done</Text>
            </View>
            {total ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {doneToday ? <View style={[st.bar, { flex: doneToday, backgroundColor: colors.navy }]} /> : null}
                {pending ? <View style={[st.bar, { flex: pending, backgroundColor: colors.orange }]} /> : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        {quick.length ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {quick.map((q) => (
              <Pressable key={q.label} onPress={() => router.push(q.href as never)} accessibilityRole="button" style={st.quick}>
                <View style={st.quickIcon}>
                  <Icon name={q.icon} size={20} color={colors.orangeText} />
                </View>
                <Text style={st.quickLabel}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {canView('stock') ? (
          <Card>
            <H2 right={<LinkText onPress={() => router.push('/staff/stock')}>See stock</LinkText>}>Stock today</H2>
            <View style={st.grid}>
              <Stat label="Current stock" value={String(lines.reduce((s, x) => s + x.line.closing, 0))} note="units" />
              <Stat
                label="Low stock"
                value={String(lines.filter((x) => isLow(x.p, x.line)).length)}
                note="reorder soon"
                noteColor={colors.orangeText}
              />
            </View>
            <View style={st.grid}>
              <Stat label="Received" value={String(lines.reduce((s, x) => s + x.line.received, 0))} note="units" />
              <Stat label="Delivered" value={String(lines.reduce((s, x) => s + x.line.delivered, 0))} note="units" />
            </View>
          </Card>
        ) : null}

        {canView('riders') ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2>{w.Riders}</H2>
            {state.riders.map((r, i) => {
              const now = riderNow(state, r);
              const d = riderDay(state, r.id);
              return (
                <Row
                  key={r.id}
                  first={i === 0}
                  lead={<Avatar initials={r.initials} />}
                  title={r.name}
                  sub={`${r.bike.split(' · ')[0]} · ${d.left ? `${count(d.left, 'delivery')} left` : 'all done'}`}
                  rightSub={<Badge kind={now.kind}>{now.label}</Badge>}
                  onPress={() => router.push(`/rider-info/${r.id}`)}
                />
              );
            })}
          </Card>
        ) : null}

        {other.length || can('closeDay') ? (
          <Card style={{ paddingVertical: 4 }}>
            {can('closeDay') || canView('stock') ? (
              <Row
                first
                lead={<IconTile name="file" />}
                title="Daily record"
                sub={can('closeDay') ? "Each day's record, and closing today" : "Each day's stock and deliveries"}
                rightSub={<Icon name="chev" color={colors.muted} />}
                onPress={() => router.push('/day-record')}
              />
            ) : null}
            {other.map((o, i) => (
              <Row
                key={o.area}
                first={i === 0 && !(can('closeDay') || canView('stock'))}
                lead={<IconTile name={o.icon} />}
                title={o.title}
                sub={o.sub}
                rightSub={<Icon name="chev" color={colors.muted} />}
                onPress={() => router.push(o.href as never)}
              />
            ))}
          </Card>
        ) : null}

        <Pressable onPress={() => router.push('/staff/me')} accessibilityRole="button" style={st.lock}>
          <Icon name="lock" size={20} color={colors.muted} />
          <Text style={st.lockText}>
            <Text style={st.bold}>Admin decides what you can see.</Text>
            {hidden.length ? ' Some money screens are hidden for you.' : ''} <Text style={st.link}>See my access</Text>
          </Text>
        </Pressable>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  big: { fontFamily: fonts.headBold, fontSize: 30, color: colors.navy },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  bar: { height: 10, borderRadius: 6 },
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
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.navy, textAlign: 'center' },
  lock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputLine,
  },
  lockText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
  bold: { fontFamily: fonts.bodyBold, color: colors.navy },
  link: { fontFamily: fonts.bodyBold, color: colors.orangeText },
});
