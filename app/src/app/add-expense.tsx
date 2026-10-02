import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '../components/Text';

import { Icon } from '../components/Icon';
import { Button, Chips, Field, Muted, Screen, TopBar } from '../components/ui';
import { Frequency, FREQUENCIES } from '../data/types';
import { categoryIcon } from '../lib/expenses';
import { takeDeliveryPhoto } from '../lib/photo';
import { dayLabel, naira } from '../lib/format';
import { shiftDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';
import { NoAccess } from '../components/NoAccess';

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

/** Write down money spent, or (with ?id=) fix one already written down. */
export default function AddExpense() {
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { state, mode, addExpense, updateExpense } = useStore();
  const acc = useAccess();
  const old = editId ? state.expenses.find((e) => e.id === editId) : undefined;
  const [amount, setAmount] = useState(old ? String(old.amount) : '');
  const categories =
    old && !state.settings.expenseCategories.includes(old.category)
      ? [...state.settings.expenseCategories, old.category]
      : state.settings.expenseCategories;
  const [category, setCategory] = useState<string>(old?.category ?? categories[0] ?? 'Other');
  const [frequency, setFrequency] = useState<Frequency>(old?.frequency ?? 'daily');
  const [bike, setBike] = useState(old?.bike ?? '');
  const [day, setDay] = useState(old?.day ?? state.day);
  const [note, setNote] = useState(old?.note ?? '');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);

  const bikes = [...new Set(state.riders.map((r) => r.bike.split(' · ')[0]).filter(Boolean))].sort();
  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => shiftDay(state.day, -n));
  if (old && !days.includes(old.day)) days.push(old.day);
  const n = toNumber(amount);
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      setError('');
      set(v);
    };

  const snap = async () => {
    setTaking(true);
    try {
      const r = await takeDeliveryPhoto(mode === 'demo', 'receipt photos');
      if (r && 'error' in r) setError(r.error);
      else if (r) setReceipt(r.uri);
    } catch {
      setError('Could not take the photo. Please try again.');
    } finally {
      setTaking(false);
    }
  };

  const save = () => {
    if (n <= 0) return setError('Enter how much was spent.');
    if (category === 'Other' && !note.trim()) return setError('Write what the money was for.');
    if (old) {
      updateExpense(old.id, { day, category, note: note.trim(), amount: n, frequency, bike });
      router.back();
      return;
    }
    addExpense({
      day,
      category,
      note: note.trim(),
      amount: n,
      frequency,
      bike: bike || undefined,
      receipt: receipt ?? undefined,
    });
    router.back();
  };

  const title = old ? (old.payee ? 'Change payment' : 'Change expense') : 'Add expense';
  if (editId && !old) return <NoAccess title={title} />;
  if (!acc.canEdit(old?.payee ? 'staffpay' : 'expenses')) return <NoAccess title={title} />;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title={old ? 'Save changes' : 'Save expense'} kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <View style={st.amountBox}>
          <Text style={st.amountLabel}>AMOUNT</Text>
          <TextInput
            value={amount ? naira(n) : ''}
            onChangeText={change(setAmount)}
            placeholder="₦0"
            placeholderTextColor="#8A93A6"
            keyboardType="number-pad"
            accessibilityLabel="Amount"
            style={st.amount}
          />
        </View>

        {old?.payee ? null : (
          <View style={{ gap: 8 }}>
            <Text style={st.label}>Category</Text>
            <View style={st.grid}>
              {categories.map((c) => {
                const on = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => change(setCategory)(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[st.cat, on ? st.catOn : st.catOff]}
                  >
                    <Icon name={categoryIcon(c)} size={22} />
                    <Text style={st.catText}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={st.label}>How often?</Text>
          <Chips<Frequency> full options={FREQUENCIES} value={frequency} onChange={setFrequency} />
          <Muted>This is for grouping only. Nothing is added again by itself.</Muted>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={st.label}>For which bike? (optional)</Text>
          <Chips<string>
            options={[{ value: '', label: 'No bike' }, ...bikes.map((b) => ({ value: b, label: b }))]}
            value={bike}
            onChange={setBike}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={st.label}>Date</Text>
          <Chips<string>
            options={days.map((d, i) => ({
              value: d,
              label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayLabel(d).slice(0, 5),
            }))}
            value={day}
            onChange={setDay}
          />
        </View>

        <Field
          label={category === 'Other' ? 'What was it for?' : 'Note (optional)'}
          value={note}
          onChangeText={change(setNote)}
          placeholder="e.g. Filled 4 bikes at the station"
        />

        {old ? null : receipt ? (
          <View style={{ gap: 8 }}>
            <Image source={{ uri: receipt }} style={st.receipt} resizeMode="cover" accessibilityLabel="Receipt photo" />
            <Button title="Remove receipt photo" kind="danger" icon="x" onPress={() => setReceipt(null)} />
          </View>
        ) : (
          <Pressable onPress={snap} disabled={taking} accessibilityRole="button" style={st.addReceipt}>
            <Icon name="camera" size={20} color={colors.muted} />
            <Text style={st.addReceiptText}>{taking ? 'Opening…' : 'Add receipt photo (optional)'}</Text>
          </Pressable>
        )}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  amountBox: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  amountLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  amount: { width: '100%', textAlign: 'center', fontFamily: fonts.headBold, fontSize: 40, color: colors.navy, padding: 0 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: {
    width: '22.5%',
    minHeight: 76,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  catOn: { borderWidth: 2, borderColor: colors.navy, backgroundColor: '#EEF1F8' },
  catOff: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  catText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.navy, textAlign: 'center' },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  receipt: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: colors.grayBg },
  addReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputLine,
    backgroundColor: colors.white,
  },
  addReceiptText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
});
