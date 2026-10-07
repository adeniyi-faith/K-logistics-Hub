import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Icon } from '../components/Icon';
import { PeriodPicker } from '../components/PeriodPicker';
import { Card, H2, Muted, Screen, Stat, TopBar } from '../components/ui';
import { count, naira } from '../lib/format';
import { daysIn, periodMoney, periodOf, Period, shortNaira } from '../lib/money';
import { shiftDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Finance() {
  const { state } = useStore();
  const acc = useAccess();
  const [period, setPeriod] = useState<Period>(() => periodOf('week', state.day));

  if (!acc.canView('finance')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Finance" back />
        <Screen>
          <Muted>Only Admin can see finance and profit.</Muted>
        </Screen>
      </View>
    );
  }

  const m = periodMoney(state, period);
  const quick = (['day', 'week', 'month'] as const).map((k) => ({
    key: k,
    label: { day: 'Today', week: 'This week', month: 'This month' }[k],
    profit: periodMoney(state, periodOf(k, state.day)).profit,
  }));
  const before = periodMoney(state, { ...period, ...shifted(period) });
  const name = new Map(state.products.map((p) => [p.id, p]));
  const top = m.products.slice(0, 5);
  const best = Math.max(1, ...top.map((p) => p.profit));
  const word = { day: 'today', week: 'this week', month: 'this month' }[period.kind];
  const isNow = period.to >= state.day;

  // Bars: each day of a week, or each week of a month.
  const bars =
    period.kind === 'week'
      ? m.days.map((d) => ({
          key: d.day,
          label: WEEKDAY[new Date(`${d.day}T12:00:00`).getDay()],
          value: d.sales,
          now: d.day === state.day,
          later: d.day > state.day,
        }))
      : period.kind === 'month'
        ? weeksOf(period).map((w, i) => {
            const v = m.days.filter((d) => d.day >= w.from && d.day <= w.to).reduce((s, d) => s + d.sales, 0);
            return {
              key: w.from,
              label: `Wk ${i + 1}`,
              value: v,
              now: state.day >= w.from && state.day <= w.to,
              later: w.from > state.day,
            };
          })
        : [];
  const tallest = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Finance" back right={<Icon name="lock" size={18} color={colors.muted} />} />
      <Screen>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {quick.map((q) => (
            <View key={q.key} style={st.quick}>
              <Text style={st.quickLabel}>{q.label}</Text>
              <Text style={st.quickValue} numberOfLines={1} adjustsFontSizeToFit>
                {shortNaira(q.profit)}
              </Text>
              <Text style={st.quickNote}>profit</Text>
            </View>
          ))}
        </View>
        <PeriodPicker value={period} onChange={setPeriod} />

        <View style={st.hero}>
          <Text style={st.heroLabel}>{isNow ? `Profit ${word}` : 'Profit'}</Text>
          <Text style={st.heroValue}>{naira(m.profit)}</Text>
          <Text style={st.heroSub}>Orders − cost of goods − expenses</Text>
          <View style={st.heroRow}>
            <Bit label="Sales" value={shortNaira(m.sales)} />
            <Bit label="Cost of goods" value={shortNaira(m.costOfGoods)} />
            <Bit label="Expenses" value={shortNaira(m.expenses)} />
          </View>
        </View>

        <View style={st.grid}>
          <Stat label="Units sold" value={String(m.unitsSold)} note={change(m.unitsSold, before.unitsSold, period.kind)} />
          <Stat label="Products delivered" value={String(m.unitsDelivered)} note="units" />
        </View>
        <View style={st.grid}>
          <Stat label="Deliveries" value={String(m.deliveries)} note={`by ${count(m.ridersUsed, 'rider')}`} />
          <Stat label="Staff pay" value={shortNaira(m.staffPay)} note={`of ${shortNaira(m.expenses)} expenses`} />
        </View>

        {bars.length ? (
          <Card>
            <H2>{period.kind === 'week' ? 'Orders each day (₦)' : 'Orders each week (₦)'}</H2>
            <View style={st.chart}>
              {bars.map((b) => (
                <View key={b.key} style={st.barCol}>
                  <Text style={[st.barValue, b.now && { color: colors.navy }]}>
                    {b.later ? '' : shortNaira(b.value).replace('₦', '')}
                  </Text>
                  <View
                    style={[
                      st.bar,
                      {
                        height: Math.max(b.value ? 4 : 0, Math.round((b.value / tallest) * 120)),
                        backgroundColor: b.now ? colors.orange : colors.navy,
                      },
                    ]}
                  />
                  <Text style={st.barLabel}>{b.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card>
          <H2>Where the money went</H2>
          {m.categories.length === 0 ? <Muted>No expenses.</Muted> : null}
          {m.categories.map((c) => (
            <Line key={c.category} label={c.category} value={naira(c.amount)} />
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line }} />
          <Line label="Total expenses" value={naira(m.expenses)} bold />
        </Card>

        <Card style={{ gap: 0 }}>
          <H2>Product performance</H2>
          {top.length === 0 ? <Muted style={{ paddingTop: 8 }}>No sales.</Muted> : null}
          {top.map((p) => {
            const product = name.get(p.productId);
            return (
              <View key={p.productId} style={st.perf}>
                <View style={st.perfTop}>
                  <Text style={st.perfName} numberOfLines={1}>
                    {product?.name ?? 'Product'}
                  </Text>
                  <Text style={st.perfProfit}>{naira(p.profit)}</Text>
                </View>
                <View style={st.perfBottom}>
                  <View style={st.track}>
                    <View style={[st.fill, { width: `${Math.max(2, (p.profit / best) * 100)}%` }]} />
                  </View>
                  <Text style={st.perfUnits}>{count(p.units, product?.unit ?? 'unit')}</Text>
                </View>
              </View>
            );
          })}
          <Muted style={{ paddingTop: 10 }}>Profit per product uses each product's current cost price.</Muted>
        </Card>
      </Screen>
    </View>
  );
}

/** The same stretch of time just before this one. */
function shifted(p: Period): { from: string; to: string } {
  if (p.kind === 'month') {
    const prev = periodOf('month', shiftDay(p.from, -1));
    return { from: prev.from, to: prev.to };
  }
  const len = p.kind === 'week' ? 7 : 1;
  return { from: shiftDay(p.from, -len), to: shiftDay(p.to, -len) };
}

function change(now: number, before: number, kind: Period['kind']): string | undefined {
  if (!before) return undefined;
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% vs ${kind === 'day' ? 'the day before' : `last ${kind}`}`;
}

/** The weeks (Monday to Sunday) that make up a month, cut to the month's own days. */
function weeksOf(p: Period): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (const d of daysIn(p)) {
    const w = periodOf('week', d);
    const last = out[out.length - 1];
    if (last && last.to >= d) continue;
    out.push({ from: d, to: w.to < p.to ? w.to : p.to });
  }
  return out;
}

function Bit({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={st.bitLabel}>{label}</Text>
      <Text style={st.bitValue}>{value}</Text>
    </View>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[st.line, bold && { fontFamily: fonts.bodyBold }]}>{label}</Text>
      <Text style={[st.line, { fontFamily: fonts.bodyBold }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: 20, padding: 18, gap: 4 },
  heroLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B8C3DB' },
  heroValue: { fontFamily: fonts.headBold, fontSize: 32, color: colors.white },
  heroSub: { fontFamily: fonts.body, fontSize: 12, color: '#B8C3DB' },
  heroRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2C3F6B' },
  bitLabel: { fontFamily: fonts.body, fontSize: 12, color: '#B8C3DB' },
  bitValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  grid: { flexDirection: 'row', gap: 10 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 170 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' },
  bar: { width: '70%', borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  barValue: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted },
  barLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  line: { fontFamily: fonts.body, fontSize: 14, color: colors.navy },
  perf: { gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  perfTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  perfName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  quickValue: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  quickNote: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  perfProfit: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.green },
  perfBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 6, backgroundColor: '#EEF1F8' },
  fill: { height: 8, borderRadius: 6, backgroundColor: colors.navy },
  perfUnits: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, minWidth: 64, textAlign: 'right' },
});
