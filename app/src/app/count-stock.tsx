import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NoAccess } from '../components/NoAccess';
import { Text } from '../components/Text';
import { Button, Card, Chips, Field, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { count } from '../lib/format';
import { stockFor } from '../lib/stock';
import { useAccess } from '../lib/useAccess';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Why the stock count changes. Recount: type what is really there. The rest: type how many. */
const REASONS = ['Recount', 'Damaged', 'Expired', 'Returned by customer', 'Other'] as const;
type Reason = (typeof REASONS)[number];

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

/** Correct a product's stock: a recount, damaged or expired goods, or a return. */
export default function CountStock() {
  const params = useLocalSearchParams<{ product?: string }>();
  const { state, countStock } = useStore();
  const acc = useAccess();
  const [productId, setProductId] = useState(params.product ?? '');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState<Reason>('Recount');
  const [way, setWay] = useState<'off' | 'on'>('off');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!acc.canEdit('stock')) return <NoAccess title="Count stock" />;

  const product = state.products.find((p) => p.id === productId);
  const line = product ? stockFor(state, product.id) : null;
  const n = toNumber(qty);
  const now = line?.closing ?? 0;
  // How the count moves: up for a return, down for damage, to the typed number for a recount.
  const change =
    reason === 'Recount'
      ? qty.trim()
        ? n - now
        : 0
      : reason === 'Returned by customer' || (reason === 'Other' && way === 'on')
        ? n
        : -n;

  const save = () => {
    if (!product) return setError('Pick the product.');
    if (!qty.trim()) return setError(reason === 'Recount' ? 'Enter how many are in the store now.' : 'Enter how many.');
    if (reason === 'Other' && !note.trim()) return setError('Write what happened.');
    if (!change) return setError('That is the same as the stock now, so there is nothing to change.');
    countStock({ productId: product.id, change, reason: [reason, note.trim()].filter(Boolean).join(': ') });
    router.back();
  };

  const matches = state.products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Count stock" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save stock change" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        {product && line ? (
          <Card>
            <Row
              first
              title={product.name}
              sub={`${count(now, product.unit)} in the store now`}
              rightSub={
                params.product ? undefined : (
                  <Text style={st.link} onPress={() => setProductId('')}>
                    Change
                  </Text>
                )
              }
            />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 8 }}>
            <Field label="Which product?" placeholder="Search products" value={search} onChangeText={setSearch} />
            {matches.slice(0, 8).map((p, i) => (
              <Row
                key={p.id}
                first={i === 0}
                title={p.name}
                sub={`${count(stockFor(state, p.id).closing, p.unit)} in the store`}
                onPress={() => (setError(''), setProductId(p.id))}
              />
            ))}
          </Card>
        )}

        <Card>
          <H2>What happened?</H2>
          <Chips<Reason>
            options={REASONS.map((r) => ({ value: r, label: r }))}
            value={reason}
            onChange={(r) => (setError(''), setReason(r))}
          />
          {reason === 'Other' ? (
            <Chips<'off' | 'on'>
              full
              options={[
                { value: 'off', label: 'Take off stock' },
                { value: 'on', label: 'Add to stock' },
              ]}
              value={way}
              onChange={setWay}
            />
          ) : null}
          <Field
            label={
              reason === 'Recount'
                ? 'How many are in the store now?'
                : reason === 'Returned by customer'
                  ? 'How many came back?'
                  : reason === 'Other'
                    ? 'How many?'
                    : `How many are ${reason.toLowerCase()}?`
            }
            value={qty}
            onChangeText={(t) => (setError(''), setQty(t))}
            keyboardType="number-pad"
          />
          <Field
            label={reason === 'Other' ? 'What happened?' : 'Note (optional)'}
            value={note}
            onChangeText={(t) => (setError(''), setNote(t))}
          />
        </Card>

        {product && change ? (
          <View style={st.result}>
            <Text style={st.resultText}>
              {change > 0 ? `Adds ${count(change, product.unit)}` : `Takes off ${count(-change, product.unit)}`}. Stock after
              this: {count(now + change, product.unit)}.
            </Text>
          </View>
        ) : null}
        <Muted>The change counts for today and shows in the product's history with your name and the reason.</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  link: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.orangeText },
  result: { backgroundColor: colors.blueBg, borderRadius: 12, padding: 12 },
  resultText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.blue },
});
