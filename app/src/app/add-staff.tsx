import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { useNewLogin } from '../components/NewLogin';
import { SwitchRow } from '../components/SwitchRow';
import { Button, Card, Chips, Field, Muted, Screen, TopBar } from '../components/ui';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Add someone to the payroll, or (with ?id=) change their details and pay. Riders are added under Riders & bikes. */
export default function AddStaff() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { state, addStaff, updateStaff } = useStore();
  const old = editId ? state.staff.find((x) => x.id === editId) : undefined;
  const [name, setName] = useState(old?.name ?? '');
  const [job, setJob] = useState(old?.job ?? '');
  const [phone, setPhone] = useState(old?.phone ?? '');
  const [pay, setPay] = useState(old ? String(old.pay) : '');
  const [every, setEvery] = useState<'month' | 'week'>(old?.payEvery ?? 'month');
  const [active, setActive] = useState(old?.active ?? true);
  const [roleId, setRoleId] = useState(state.roles[0]?.id ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useNewLogin('staff', name.trim().split(' ')[0] || 'They');

  const title = old ? 'Change staff' : 'Add staff';
  if (state.session?.role !== 'admin' || (editId && !old)) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title={title} back />
        <Screen>
          <Muted>
            {editId && old === undefined && state.session?.role === 'admin'
              ? "This person can't be found."
              : 'Only Admin can add staff.'}
          </Muted>
        </Screen>
      </View>
    );
  }

  const n = Number(pay.replace(/[^\d]/g, '')) || 0;
  const save = async () => {
    if (!name.trim()) return setError('Enter their full name.');
    if (!job.trim()) return setError('Enter their job, e.g. Store keeper.');
    if (n <= 0) return setError('Enter their pay.');
    if (old) {
      updateStaff(old.id, { name: name.trim(), job: job.trim(), phone: phone.trim(), pay: n, payEvery: every, active });
      router.back();
      return;
    }
    const bad = login.check();
    if (bad) return setError(bad);
    setBusy(true);
    const id = await addStaff({
      name: name.trim(),
      job: job.trim(),
      phone: phone.trim(),
      pay: n,
      payEvery: every,
      active: true,
      roleId,
    });
    const failed = await login.create(id);
    setBusy(false);
    // Saved either way; if the sign-in couldn't be made, their page lets Admin try again.
    if (failed) router.replace({ pathname: '/staff-access/[id]', params: { id, note: `${failed} Try again below.` } });
    else router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title} sub={old?.name} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button
              title={busy ? 'Saving…' : old ? 'Save changes' : 'Save staff'}
              kind="accent"
              icon="check"
              onPress={save}
              disabled={busy}
            />
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
          {old ? (
            <SwitchRow
              label="On the payroll"
              sub={active ? 'Shows in Staff & pay.' : 'Hidden from Staff & pay. Past payments stay in the records.'}
              value={active}
              onChange={setActive}
            />
          ) : null}
        </Card>
        {old ? (
          <Muted>To change their role, access or sign-in, open them in Users & access.</Muted>
        ) : (
          <>
            <Card>
              <Text style={st.label}>Staff role</Text>
              <Chips<string>
                options={state.roles.map((r) => ({ value: r.id, label: r.name }))}
                value={roleId}
                onChange={setRoleId}
              />
              <Muted>{state.roles.find((r) => r.id === roleId)?.summary}</Muted>
              <Muted>You can change single things just for this person afterwards, in Users & access.</Muted>
            </Card>
            {login.card}
            <Muted>Riders are added under Riders & bikes.</Muted>
          </>
        )}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
