import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { naira } from '../lib/format';
import { dayMoney, deliveredOn, riderDay, shiftDay, stockFor } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const date = (day: string) => new Date(`${day}T12:00:00`);

/** Everything about one day: stock in and out, money, deliveries and rider earnings. */
export default function DayRecord() {
  const { state } = useStore();
  const acc = useAccess();
  const [day, setDay] = useState(state.day);
  const strip = useRef<ScrollView>(null);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(state.day, i - 6));
  const open = day === state.day;

  const lines = state.products.map((p) => ({ p, line: stockFor(state, p.id, day) }));
  const received = lines.reduce((s, x) => s + x.line.received, 0);
  const deliveredUnits = lines.reduce((s, x) => s + x.line.delivered, 0);
  const remaining = lines.reduce((s, x) => s + x.line.closing, 0);
  const money = dayMoney(state, day);
  const delivered = state.orders.filter((o) => o.status === 'delivered' && deliveredOn(o) === day).length;
  const pending = open ? state.orders.filter((o) => o.status === 'pending').length : 0;
  const riders = state.riders.map((r) => ({ r, d: riderDay(state, r.id, day) })).filter((x) => x.d.delivered > 0);
  const d = date(day);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Daily record" back />
      <Screen
        footer={
          open && acc.can('closeDay') ? (
            <Button title="Review and close day" kind="accent" onPress={() => router.push('/close-day')} />
          ) : undefined
        }
      >
        <ScrollView
          ref={strip}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          // Today is last; start scrolled to it.
          onContentSizeChange={() => strip.current?.scrollToEnd({ animated: false })}
        >
          {days.map((x) => {
            const on = x === day;
            return (
              <Pressable
                key={x}
                onPress={() => setDay(x)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[st.dayChip, on ? st.dayOn : st.dayOff]}
              >
                <Text style={[st.dayWd, { color: on ? '#C9D3E6' : colors.muted }]}>{WD[date(x).getDay()]}</Text>
                <Text style={[st.dayNum, { color: on ? colors.white : colors.navy }]}>{date(x).getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={st.title}>
          <Text style={st.titleText}>
            {DAYS[d.getDay()]}, {d.getDate()} {MO[d.getMonth()]}
          </Text>
          {open ? <Badge kind="blue">Day open</Badge> : <Badge kind="gray">Closed</Badge>}
        </View>

        <Card style={{ paddingVertical: 8 }}>
          <H2>What came in, what went out</H2>
          <Row first title="Received" right={`+${received} units`} />
          <Row title="Delivered" right={`−${deliveredUnits} units`} />
          <Row title="Remaining" right={`${remaining} units`} />
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Money</H2>
          <Row first title="Total sales" right={naira(money.sales)} />
          {acc.can('seeCost') ? (
            <>
              <Row title="Cost of goods sold" right={naira(money.costOfGoods)} />
              <Row
                title="Expenses"
                right={naira(money.expenses)}
                onPress={acc.canView('expenses') ? () => router.push('/expenses') : undefined}
              />
              <Row title="Profit" right={naira(money.profit)} />
            </>
          ) : null}
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Deliveries</H2>
          <Row first title="Completed" right={String(delivered)} />
          {open ? <Row title="Pending" sub="Carry over if not done" right={String(pending)} /> : null}
        </Card>

        <Card style={{ paddingVertical: 8 }}>
          <H2>Rider earnings</H2>
          {riders.length === 0 ? <Muted>No deliveries this day.</Muted> : null}
          {riders.map(({ r, d: rd }, i) => (
            <Row key={r.id} first={i === 0} title={r.name} sub={`${rd.delivered} deliveries`} right={naira(rd.earned)} />
          ))}
          {riders.length ? <Row title="All riders" right={naira(riders.reduce((s, x) => s + x.d.earned, 0))} /> : null}
        </Card>

        <Card>
          <H2>Stock by product</H2>
          <View style={st.tr}>
            <Text style={[st.th, st.name]}>Product</Text>
            <Text style={st.th}>Open</Text>
            <Text style={st.th}>In</Text>
            <Text style={st.th}>Out</Text>
            <Text style={st.th}>Close</Text>
          </View>
          {lines.map(({ p, line }) => (
            <Pressable key={p.id} style={st.tr} onPress={() => router.push(`/product/${p.id}`)}>
              <Text style={[st.td, st.name]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={st.td}>{line.opening}</Text>
              <Text style={st.td}>+{line.received}</Text>
              <Text style={st.td}>−{line.delivered}</Text>
              <Text style={[st.td, st.tdStrong]}>{line.closing}</Text>
            </Pressable>
          ))}
        </Card>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  dayChip: { width: 52, minHeight: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1 },
  dayOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayOff: { backgroundColor: colors.white, borderColor: colors.line },
  dayWd: { fontFamily: fonts.bodyBold, fontSize: 11 },
  dayNum: { fontFamily: fonts.head, fontSize: 18 },
  title: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleText: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  th: { width: 44, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  td: { width: 44, textAlign: 'right', fontFamily: fonts.body, fontSize: 14, color: colors.navy },
  tdStrong: { fontFamily: fonts.bodyBold },
  name: { flex: 1, width: undefined, textAlign: 'left' },
});
