import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Chips, Field, Muted, Row, Screen, TopBar } from '../components/ui';
import { dayLabel, naira } from '../lib/format';
import { PAY_CATEGORY, paidIn, staffDue } from '../lib/pay';
import { riderOwed } from '../lib/riders';
import { shiftDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Pay a staff member or rider. It is saved as a "Staff pay" expense. */
export default function Pay() {
  const { who } = useLocalSearchParams<{ who: string }>();
  const { state, addExpense } = useStore();
  const staff = state.staff.find((x) => x.id === who);
  const rider = state.riders.find((r) => r.id === who);
  const due = staff ? staffDue(state, staff) : rider ? riderOwed(state, rider.id).owed : 0;
  const [amount, setAmount] = useState(due ? String(due) : '');
  const [day, setDay] = useState(state.day);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const person = staff ?? rider;
  if (!person || state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Pay" back />
        <Screen>
          <Muted>Only Admin can pay staff and riders.</Muted>
        </Screen>
      </View>
    );
  }

  const n = Number(amount.replace(/[^\d]/g, '')) || 0;
  const save = () => {
    if (n <= 0) return setError('Enter how much you are paying.');
    addExpense({
      day,
      category: PAY_CATEGORY,
      note: note.trim() || `Pay, ${person.name}`,
      amount: n,
      frequency: staff ? (staff.payEvery === 'month' ? 'monthly' : 'weekly') : 'one_time',
      payee: person.id,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`Pay ${person.name.split(' ')[0]}`} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title={`Save payment of ${naira(n)}`} kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <View style={st.head}>
          <Avatar initials={person.initials} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{person.name}</Text>
            <Muted>
              {staff
                ? `${staff.job} · ${naira(staff.pay)} a ${staff.payEvery}`
                : `Rider · ${naira(rider!.ratePerDelivery)} per delivery`}
            </Muted>
          </View>
        </View>

        <Card style={{ paddingVertical: 4 }}>
          {staff ? (
            <>
              <Row first title={`Paid this ${staff.payEvery}`} right={naira(paidIn(state, staff.id, staff.payEvery))} />
              <Row title="Still due" right={naira(due)} />
            </>
          ) : (
            <>
              <Row first title="Earned from deliveries" right={naira(riderOwed(state, rider!.id).earned)} />
              <Row title="Paid so far" right={naira(riderOwed(state, rider!.id).paid)} />
              <Row title="Owed now" right={naira(due)} />
            </>
          )}
        </Card>

        <Card>
          <Field
            label="Amount paid"
            value={amount}
            onChangeText={(t) => (setError(''), setAmount(t))}
            keyboardType="number-pad"
          />
          <Text style={st.label}>Date</Text>
          <Chips<string>
            options={[0, 1, 2].map((k) => {
              const d = shiftDay(state.day, -k);
              return { value: d, label: k === 0 ? 'Today' : k === 1 ? 'Yesterday' : dayLabel(d).slice(0, 5) };
            })}
            value={day}
            onChange={setDay}
          />
          <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Transfer to GTBank" />
        </Card>
        <Muted>This is saved as a "Staff pay" expense, so it counts in Finance and profit.</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
