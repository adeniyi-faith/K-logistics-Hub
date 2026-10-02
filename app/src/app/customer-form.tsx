import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NoAccess } from '../components/NoAccess';
import { Text } from '../components/Text';
import { Button, Card, Chips, Field, Muted, Screen, TopBar } from '../components/ui';
import { useAccess } from '../lib/useAccess';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Change a customer's name, phone, area or address. */
export default function CustomerForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateCustomer } = useStore();
  const acc = useAccess();
  const c = state.customers.find((x) => x.id === id);
  const [name, setName] = useState(c?.name ?? '');
  const [phone, setPhone] = useState(c?.phone ?? '');
  const [area, setArea] = useState(c?.area ?? '');
  const [address, setAddress] = useState(c?.address ?? '');
  const [error, setError] = useState('');

  if (!c || !acc.canEdit('customers')) return <NoAccess title="Change customer" />;

  const save = () => {
    if (!name.trim()) return setError('Enter the customer name.');
    updateCustomer(c.id, { name: name.trim(), phone: phone.trim(), area, address: address.trim() });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Change customer" sub={c.name} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save changes" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <Card>
          <Field label="Name" value={name} onChangeText={(t) => (setError(''), setName(t))} />
          <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={st.label}>Area</Text>
          <Chips<string>
            options={[...new Set([...state.settings.areas, ...(area ? [area] : [])])].map((a) => ({ value: a, label: a }))}
            value={area}
            onChange={setArea}
          />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="House no., street, landmark" />
        </Card>
        <Muted>Orders not delivered yet get the new name and phone. Past orders keep what they had.</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
