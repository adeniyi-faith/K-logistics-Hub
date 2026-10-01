import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, Field, Muted, Screen, TopBar } from '../components/ui';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Add someone to the payroll. Riders are added under Riders & bikes instead. */
export default function AddStaff() {
  const { state, addStaff } = useStore();
  const [name, setName] = useState('');
  const [job, setJob] = useState('');
  const [phone, setPhone] = useState('');
  const [pay, setPay] = useState('');
  const [every, setEvery] = useState<'month' | 'week'>('month');
  const [error, setError] = useState('');

  if (state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Add staff" back />
        <Screen>
          <Muted>Only Admin can add staff.</Muted>
        </Screen>
      </View>
    );
  }

  const n = Number(pay.replace(/[^\d]/g, '')) || 0;
  const save = () => {
    if (!name.trim()) return setError('Enter their full name.');
    if (!job.trim()) return setError('Enter their job, e.g. Store keeper.');
    if (n <= 0) return setError('Enter their pay.');
    addStaff({ name: name.trim(), job: job.trim(), phone: phone.trim(), pay: n, payEvery: every, active: true });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Add staff" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save staff" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <Card>
          <Field label="Full name" value={name} onChangeText={(t) => (setError(''), setName(t))} />
          <Field label="Job" value={job} onChangeText={setJob} placeholder="e.g. Store keeper" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Pay" value={pay} onChangeText={setPay} keyboardType="number-pad" />
          <Text style={st.label}>Paid every</Text>
          <Chips<'month' | 'week'>
            full
            options={[
              { value: 'month', label: 'Month' },
              { value: 'week', label: 'Week' },
            ]}
            value={every}
            onChange={setEvery}
          />
        </Card>
        <Muted>Riders are added under Riders & bikes. Giving staff their own sign-in comes with the staff app (step 6).</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
