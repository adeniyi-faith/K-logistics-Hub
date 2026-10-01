import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Icon } from '../components/Icon';
import { RiderAvatar } from '../components/RiderAvatar';
import { Button, Card, Chips, Field, H2, Muted, Screen, TopBar } from '../components/ui';
import { takeDeliveryPhoto } from '../lib/photo';
import { bikeParts } from '../lib/riders';
import { useWords } from '../lib/words';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const RELATIONS = ['Wife', 'Husband', 'Parent', 'Brother', 'Sister', 'Child', 'Friend', 'Other'];
const digits = (t: string) => t.replace(/\D/g, '');

/** A rider changes their own details. Name, ID and bike stay with Admin. */
export default function RiderEdit() {
  const { state, mode, updateRider, changePassword } = useStore();
  const w = useWords();
  const r = state.riders.find((x) => x.id === state.session?.riderId);
  const [photo, setPhoto] = useState(r?.photo);
  const [phone, setPhone] = useState(r?.phone ?? '');
  const [phone2, setPhone2] = useState(r?.phone2 ?? '');
  const [address, setAddress] = useState(r?.address ?? '');
  const [kinName, setKinName] = useState(r?.kinName ?? '');
  const [kinPhone, setKinPhone] = useState(r?.kinPhone ?? '');
  const [kinRelation, setKinRelation] = useState(r?.kinRelation ?? '');
  const [payBank, setPayBank] = useState(r?.payBank ?? '');
  const [payAccount, setPayAccount] = useState(r?.payAccount ?? '');
  const [payName, setPayName] = useState(r?.payName ?? r?.name ?? '');
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState('');
  const [askSent, setAskSent] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwNote, setPwNote] = useState('');
  const [error, setError] = useState('');

  if (!r) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Edit profile" back />
        <Screen>
          <Muted>Only {w.riders} can change their profile here.</Muted>
        </Screen>
      </View>
    );
  }

  const bike = bikeParts(r.bike);
  const clear =
    <T,>(fn: (v: T) => void) =>
    (v: T) => {
      setError('');
      fn(v);
    };

  const newPhoto = async () => {
    const res = await takeDeliveryPhoto(mode === 'demo' || Platform.OS === 'web', 'your photo');
    if (!res) return;
    if ('error' in res) return setError(res.error);
    setPhoto(res.uri);
  };

  const save = () => {
    if (digits(phone).length < 10) return setError('Enter your phone number with at least 10 digits.');
    if (phone2.trim() && digits(phone2).length < 10) return setError('The other phone number needs at least 10 digits.');
    if (kinPhone.trim() && digits(kinPhone).length < 10) return setError("Your next of kin's phone needs at least 10 digits.");
    if (payAccount.trim() && digits(payAccount).length !== 10) return setError('The account number must have 10 digits.');
    if (payAccount.trim() && !payBank.trim()) return setError('Enter the bank or wallet for your account.');
    const account = digits(payAccount);
    const payMoved = account !== (r.payAccount ?? '') || payBank.trim() !== (r.payBank ?? '');
    updateRider(r.id, {
      photo,
      phone: phone.trim(),
      phone2: phone2.trim(),
      address: address.trim(),
      kinName: kinName.trim(),
      kinPhone: kinPhone.trim(),
      kinRelation,
      payBank: payBank.trim(),
      payAccount: account,
      payName: payName.trim(),
      // Admin sees a notice to check the new account before the next payment.
      payChanged: payMoved && r.payAccount ? state.day : r.payChanged,
    });
    router.back();
  };

  const sendAsk = () => {
    if (!ask.trim()) return;
    updateRider(r.id, { changeRequest: ask.trim(), changeRequestAt: state.day });
    setAsk('');
    setAsking(false);
    setAskSent(true);
  };

  const savePassword = async () => {
    if (pw.length < 8) return setPwNote('Use at least 8 characters.');
    if (pw !== pw2) return setPwNote("The two passwords don't match.");
    setPwNote('Saving…');
    const err = await changePassword(pw);
    setPwNote(err ?? 'Password changed. Use it next time you sign in.');
    if (!err) {
      setPw('');
      setPw2('');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Edit profile" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save changes" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <View style={st.head}>
          <View>
            <RiderAvatar rider={{ ...r, photo }} size={88} />
            <Pressable onPress={newPhoto} accessibilityRole="button" accessibilityLabel="Change photo" style={st.cam}>
              <Icon name="camera" size={18} color={colors.white} />
            </Pressable>
          </View>
          <Muted>Tap the camera to take or choose a new photo</Muted>
        </View>

        <Card>
          <H2>Contact</H2>
          <Field label="Phone number" value={phone} onChangeText={clear(setPhone)} keyboardType="phone-pad" />
          <Field
            label="Other phone (optional)"
            value={phone2}
            onChangeText={clear(setPhone2)}
            keyboardType="phone-pad"
            placeholder="Second line"
          />
          <Field label="Home address" value={address} onChangeText={setAddress} placeholder="House no., street, area" />
        </Card>

        <Card>
          <H2>Next of kin</H2>
          <Field label="Full name" value={kinName} onChangeText={setKinName} />
          <Field label="Their phone number" value={kinPhone} onChangeText={clear(setKinPhone)} keyboardType="phone-pad" />
          <Text style={st.label}>Relationship</Text>
          <Chips<string> options={RELATIONS.map((x) => ({ value: x, label: x }))} value={kinRelation} onChange={setKinRelation} />
        </Card>

        <Card>
          <H2>Where to pay me</H2>
          <Field
            label="Bank or wallet"
            value={payBank}
            onChangeText={clear(setPayBank)}
            placeholder="e.g. Opay, Moniepoint, GTBank"
          />
          <Field
            label="Account number"
            value={payAccount}
            onChangeText={clear(setPayAccount)}
            keyboardType="number-pad"
            placeholder="10 digits"
          />
          <Field label="Account name" value={payName} onChangeText={setPayName} />
          <View style={st.note}>
            <Icon name="shield" size={18} color={colors.navy} />
            <Text style={st.noteText}>
              Admin gets a notice when you change your pay account, before the next payment goes out.
            </Text>
          </View>
        </Card>

        <Card>
          <H2>Checked by Admin</H2>
          <Locked label="Full name" value={r.name} why="Must match your ID" />
          <Locked label="ID" value={r.idType ?? 'Not added'} why="Send a new photo of your ID if it changed" />
          <Locked
            label="Bike & plate number"
            value={[bike.name, bike.plate].filter(Boolean).join(' · ')}
            why="Bikes are given by Admin"
          />
          {asking ? (
            <View style={{ gap: 8 }}>
              <Field
                label="What should Admin change?"
                value={ask}
                onChangeText={setAsk}
                placeholder="e.g. My name is spelt Emeka Obi"
              />
              <Button title="Send to Admin" kind="primary" onPress={sendAsk} disabled={!ask.trim()} />
            </View>
          ) : (
            <Button title="Ask Admin to change something" kind="ghost" onPress={() => setAsking(true)} />
          )}
          {askSent || r.changeRequest ? <Muted>Sent to Admin: "{r.changeRequest}"</Muted> : null}
        </Card>

        <Card>
          <H2>Password</H2>
          <Field label="New password" value={pw} onChangeText={(t) => (setPwNote(''), setPw(t))} secureTextEntry />
          <Field label="New password again" value={pw2} onChangeText={(t) => (setPwNote(''), setPw2(t))} secureTextEntry />
          <Button title="Change password" kind="ghost" icon="lock" onPress={savePassword} disabled={!pw} />
          {pwNote ? <Muted>{pwNote}</Muted> : <Muted>Needs internet.</Muted>}
        </Card>
      </Screen>
    </View>
  );
}

function Locked({ label, value, why }: { label: string; value: string; why: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={st.locked}>
        <Icon name="lock" size={18} color={colors.muted} />
        <Text style={st.lockedText}>{value}</Text>
      </View>
      <Muted>{why}</Muted>
    </View>
  );
}

const st = StyleSheet.create({
  head: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  cam: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.bg,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  note: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#EEF1F8' },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.navy },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  lockedText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
