import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { naira } from '../lib/format';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

/** Change one product's cost price, selling price and low-stock alert. */
export default function EditPrices() {
  const { product: id } = useLocalSearchParams<{ product: string }>();
  const { state, updatePrices } = useStore();
  const acc = useAccess();
  const p = state.products.find((x) => x.id === id);
  const [cost, setCost] = useState(p ? String(p.costPrice) : '');
  const [sell, setSell] = useState(p ? String(p.sellPrice) : '');
  const [lowAt, setLowAt] = useState(p ? String(p.lowAt) : '');
  const [error, setError] = useState('');

  if (!p || !acc.canEdit('stock') || !acc.can('seeCost')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Edit prices" back />
        <Screen>
          <Muted>{p ? 'Only Admin can change prices.' : 'This product was not found.'}</Muted>
        </Screen>
      </View>
    );
  }

  const c = toNumber(cost);
  const s = toNumber(sell);
  const profit = s - c;

  const save = () => {
    if (c <= 0) return setError('Enter the cost price.');
    if (s <= 0) return setError('Enter the selling price.');
    updatePrices({ productId: p.id, costPrice: c, sellPrice: s, lowAt: toNumber(lowAt) });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Edit prices" sub={p.name} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save prices" kind="accent" onPress={save} />
          </View>
        }
      >
        <Card>
          <Field
            label={`Cost price per ${p.unit}`}
            keyboardType="number-pad"
            value={cost}
            onChangeText={setCost}
            helper={`Now ${naira(p.costPrice)}. What one ${p.unit} costs you to buy.`}
          />
          <Field
            label={`Selling price per ${p.unit}`}
            keyboardType="number-pad"
            value={sell}
            onChangeText={setSell}
            helper={`Now ${naira(p.sellPrice)}. New sales use this price.`}
          />
          <Field label="Warn me when stock falls to" keyboardType="number-pad" value={lowAt} onChangeText={setLowAt} />
        </Card>
        <Card style={{ paddingVertical: 8 }}>
          <H2>With these prices</H2>
          <Row first title={`Profit per ${p.unit}`} right={naira(profit)} />
          <Row title="Margin" right={s ? `${((profit / s) * 100).toFixed(1)}%` : '–'} />
        </Card>
        <Muted>Profit figures, including today's, are worked out with the cost price saved here.</Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
