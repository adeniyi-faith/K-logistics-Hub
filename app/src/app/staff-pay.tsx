import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Avatar, Badge, Button, Card, Chips, Muted, Row, Screen, TopBar } from '../components/ui';
import { dayLabel, naira } from '../lib/format';
import { periodOf, periodLabel, shortNaira } from '../lib/money';
import { PAY_CATEGORY, payeeName, payroll } from '../lib/pay';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

export default function StaffPay() {
  const { state } = useStore();
  const acc = useAccess();
  const [tab, setTab] = useState<'staff' | 'history'>('staff');

  if (!acc.canView('staffpay')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Staff & pay" back />
        <Screen>
          <Muted>Only Admin can see staff pay.</Muted>
        </Screen>
      </View>
    );
  }

  const people = payroll(state);
  const month = periodOf('month', state.day);
  const paidMonth = state.expenses
    .filter((e) => e.category === PAY_CATEGORY && e.day >= month.from && e.day <= month.to)
    .reduce((s, e) => s + e.amount, 0);
  const dueNow = people.reduce((s, p) => s + p.due, 0);
  const history = state.expenses
    .filter((e) => e.category === PAY_CATEGORY)
    .sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Staff & pay" back />
      <Screen
        footer={
          acc.isAdmin ? (
            <Button title="Add staff" kind="ghost" icon="plus" onPress={() => router.push('/add-staff')} />
          ) : undefined
        }
      >
        <Chips<'staff' | 'history'>
          full
          options={[
            { value: 'staff', label: 'Staff' },
            { value: 'history', label: 'Payment history' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <View style={st.hero}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.heroLabel}>Paid in {periodLabel(month).split(' ')[0]}</Text>
            <Text style={st.heroValue}>{shortNaira(paidMonth)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.heroLabel}>Due now</Text>
            <Text style={[st.heroValue, { color: '#FFC27A' }]}>{shortNaira(dueNow)}</Text>
          </View>
        </View>

        {tab === 'staff' ? (
          <Card style={{ paddingVertical: 0 }}>
            {people.map((p, i) => (
              <View key={p.id} style={[st.person, i > 0 && st.border]}>
                <View style={st.top}>
                  <Avatar initials={p.initials} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.name}>{p.name}</Text>
                    <Muted>{p.sub}</Muted>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={st.name}>₦{p.pay}</Text>
                    {p.due ? <Badge kind="amber">{`Due ${shortNaira(p.due)}`}</Badge> : <Badge kind="green">Paid</Badge>}
                  </View>
                </View>
                <View style={st.bottom}>
                  <Muted>
                    Paid this month <Text style={st.bold}>{naira(p.paidThisMonth)}</Text>
                  </Muted>
                  {acc.canEdit('staffpay') ? (
                    <Pressable onPress={() => router.push(`/pay?who=${p.id}`)} accessibilityRole="button" style={st.pay}>
                      <Text style={st.payText}>Pay</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {history.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No payments yet.</Muted> : null}
            {history.map((e, i) => (
              <Row
                key={e.id}
                first={i === 0}
                title={payeeName(state, e.payee) ?? (e.note || 'Staff pay')}
                sub={[dayLabel(e.day), e.note, e.by && `by ${e.by}`].filter(Boolean).join(' · ')}
                right={naira(e.amount)}
              />
            ))}
          </Card>
        )}
        <Muted>Each payment is also saved as a "Staff pay" expense, so it counts in Finance and profit.</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 12, backgroundColor: colors.navy, borderRadius: 18, padding: 16 },
  heroLabel: { fontFamily: fonts.body, fontSize: 13, color: '#B8C3DB' },
  heroValue: { fontFamily: fonts.headBold, fontSize: 22, color: colors.white },
  person: { gap: 10, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  bold: { fontFamily: fonts.bodyBold, color: colors.navy },
  pay: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputLine,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  payText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
});
