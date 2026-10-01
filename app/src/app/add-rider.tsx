import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, Chips, Field, H2, Muted, Screen, TopBar } from '../components/ui';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

const ID_TYPES = ['NIN slip', "Driver's licence", "Voter's card", 'Passport'];
const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

export default function AddRider() {
  const { state, addRider } = useStore();
  const acc = useAccess();
  const nextBike = `Bike ${state.riders.length + 1}`;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bike, setBike] = useState(nextBike);
  const [plate, setPlate] = useState('PHC-');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [rate, setRate] = useState(String(state.riders[0]?.ratePerDelivery ?? 5000));
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  if (!acc.canEdit('riders')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Add a rider" back />
        <Screen>
          <Muted>Only Admin can add riders.</Muted>
        </Screen>
      </View>
    );
  }

  const save = async () => {
    if (!name.trim()) return setError("Enter the rider's full name.");
    if (phone.replace(/\D/g, '').length < 10) return setError('Enter a phone number with at least 10 digits.');
    if (!bike.trim()) return setError('Enter the bike name, e.g. Bike 5.');
    if (toNumber(rate) <= 0) return setError('Enter how much the rider earns per delivery.');
    const p = plate.trim().toUpperCase();
    const id = await addRider({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      bike: p && p !== 'PHC-' ? `${bike.trim()} · ${p}` : bike.trim(),
      bikeModel: model.trim() || undefined,
      bikeColour: colour.trim() || undefined,
      idType,
      idNumber: idNumber.trim() || undefined,
      ratePerDelivery: toNumber(rate),
      status: active ? 'active' : 'off_duty',
      statusSince: state.day,
      joined: state.day,
    });
    router.replace(`/rider-info/${id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Add a rider" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save rider" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <Card>
          <H2>1. Personal details</H2>
          <Field
            label="Full name"
            value={name}
            onChangeText={(t) => (setError(''), setName(t))}
            placeholder="e.g. Ibrahim Sule"
          />
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0802 765 4321"
          />
          <Field
            label="Home address (optional)"
            value={address}
            onChangeText={setAddress}
            placeholder="House no., street, area"
          />
        </Card>

        <Card>
          <H2>2. Bike details</H2>
          <View style={st.two}>
            <View style={{ flex: 1 }}>
              <Field label="Bike" value={bike} onChangeText={setBike} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Plate number" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
            </View>
          </View>
          <View style={st.two}>
            <View style={{ flex: 1 }}>
              <Field label="Make & model" value={model} onChangeText={setModel} placeholder="e.g. Bajaj Boxer" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Colour" value={colour} onChangeText={setColour} placeholder="e.g. Red" />
            </View>
          </View>
        </Card>

        <Card>
          <H2>3. ID and pay</H2>
          <Text style={st.label}>ID type</Text>
          <Chips<string> options={ID_TYPES.map((t) => ({ value: t, label: t }))} value={idType} onChange={setIdType} />
          <Field label="ID number (optional)" value={idNumber} onChangeText={setIdNumber} />
          <Field
            label="Pay per delivery"
            value={rate}
            onChangeText={setRate}
            keyboardType="number-pad"
            helper="Rider earnings = deliveries completed × this amount."
          />
          <View style={st.switchRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.label}>Active</Text>
              <Muted>Can be given deliveries</Muted>
            </View>
            <Switch value={active} onValueChange={setActive} accessibilityLabel="Active" trackColor={{ true: colors.green }} />
          </View>
        </Card>

        <Muted>
          To let the rider sign in to the app, create their account in Supabase and link it to this rider (setup guide, step 3).
          Photos of the rider and their ID come later.
        </Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  two: { flexDirection: 'row', gap: 10 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
