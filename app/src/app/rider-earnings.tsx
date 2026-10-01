import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { PeriodPicker } from '../components/PeriodPicker';
import { Avatar, Card, Chips, H2, Muted, Screen, Stat, TopBar } from '../components/ui';
import { count, dayLabel, naira } from '../lib/format';
import { periodOf, Period, riderDays } from '../lib/money';
import { riderDay, shiftDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';
import { useWords } from '../lib/words';

/** Rider earnings = deliveries completed × the rider's rate, day by day. */
export default function RiderEarnings() {
  const w = useWords();
  const { state } = useStore();
  const acc = useAccess();
  const [riderId, setRiderId] = useState(state.riders[0]?.id ?? '');
  const [period, setPeriod] = useState<Period>(() => periodOf('week', state.day));
  const [day, setDay] = useState(state.day);

  if (!acc.canView('riders')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title={`${w.Rider} earnings`} back />
        <Screen>
          <Muted>Your own earnings are under History.</Muted>
        </Screen>
      </View>
    );
  }

  const rider = state.riders.find((r) => r.id === riderId);
  const sum = (p: Period) =>
    riderDays(state, riderId, p).reduce((s, d) => ({ n: s.n + d.deliveries, e: s.e + d.earned }), { n: 0, e: 0 });
  const week = sum(periodOf('week', state.day));
  const month = sum(periodOf('month', state.day));
  const rows = riderDays(state, riderId, period).filter((d) => d.day <= state.day);
  const total = rows.reduce((s, d) => ({ n: s.n + d.deliveries, e: s.e + d.earned }), { n: 0, e: 0 });
  const all = state.riders.map((r) => ({ r, ...riderDay(state, r.id, day) }));
  const allTotal = all.reduce((s, x) => ({ n: s.n + x.delivered, e: s.e + x.earned }), { n: 0, e: 0 });

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`${w.Rider} earnings`} back />
      <Screen>
        <Chips<string>
          options={state.riders.map((r) => ({ value: r.id, label: r.name.split(' ')[0] }))}
          value={riderId}
          onChange={setRiderId}
        />
        {rider ? (
          <View style={st.who}>
            <Avatar initials={rider.initials} />
            <View style={{ flex: 1 }}>
              <Text style={st.whoName}>{rider.name}</Text>
              <Muted>
                {rider.bike} · earns {naira(rider.ratePerDelivery)} per delivery
              </Muted>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="This week" value={naira(week.e)} note={count(week.n, 'delivery')} />
          <Stat label="This month" value={naira(month.e)} note={count(month.n, 'delivery')} />
        </View>

        <PeriodPicker value={period} onChange={setPeriod} />

        <Card style={{ gap: 0 }}>
          <H2>{rider ? `${rider.name.split(' ')[0]}'s earnings` : 'Earnings'}</H2>
          <Head a="Date" b="Deliveries" c="Earnings" />
          {rows.map((d, i) => (
            <Line
              key={d.day}
              a={dayLabel(d.day)}
              sub={d.day === state.day ? 'Today so far' : undefined}
              b={String(d.deliveries)}
              c={naira(d.earned)}
              first={i === 0}
            />
          ))}
          <Line a="Total" b={String(total.n)} c={naira(total.e)} total />
        </Card>

        <Card style={{ gap: 0 }}>
          <H2>All riders · {dayLabel(day)}</H2>
          <View style={{ paddingBottom: 10 }}>
            <Chips<string>
              options={[0, 1, 2, 3, 4, 5, 6].map((n) => {
                const d = shiftDay(state.day, -n);
                return { value: d, label: n === 0 ? 'Today' : n === 1 ? 'Yesterday' : dayLabel(d).slice(0, 5) };
              })}
              value={day}
              onChange={setDay}
            />
          </View>
          <Head a={w.Rider} b="Deliveries" c="Earnings" />
          {all.map((x, i) => (
            <Line key={x.r.id} a={x.r.name} b={String(x.delivered)} c={naira(x.earned)} first={i === 0} />
          ))}
          <Line a="Total" b={String(allTotal.n)} c={naira(allTotal.e)} total />
        </Card>
      </Screen>
    </View>
  );
}

function Head({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <View style={st.row3}>
      <Text style={[st.head, { flex: 1.4 }]}>{a}</Text>
      <Text style={[st.head, { flex: 1, textAlign: 'center' }]}>{b}</Text>
      <Text style={[st.head, { flex: 1.1, textAlign: 'right' }]}>{c}</Text>
    </View>
  );
}

function Line({
  a,
  sub,
  b,
  c,
  first,
  total,
}: {
  a: string;
  sub?: string;
  b: string;
  c: string;
  first?: boolean;
  total?: boolean;
}) {
  return (
    <View style={[st.row3, st.line, !first && { borderTopWidth: 1, borderTopColor: colors.line }, total && st.total]}>
      <View style={{ flex: 1.4 }}>
        <Text style={st.cellBold}>{a}</Text>
        {sub ? <Text style={st.sub}>{sub}</Text> : null}
      </View>
      <Text style={[total ? st.cellBold : st.cell, { flex: 1, textAlign: 'center' }]}>{b}</Text>
      <Text style={[st.cellBold, { flex: 1.1, textAlign: 'right' }]}>{c}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  whoName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.navy },
  row3: { flexDirection: 'row', alignItems: 'center' },
  head: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, paddingBottom: 4 },
  line: { paddingVertical: 11 },
  total: { borderTopWidth: 2, borderTopColor: colors.navy },
  cell: { fontFamily: fonts.body, fontSize: 15, color: colors.navy },
  cellBold: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
