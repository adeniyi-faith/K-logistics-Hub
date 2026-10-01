import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Icon } from '../components/Icon';
import { Button, Card, Field, Muted, Row, Screen, TopBar } from '../components/ui';
import { count, naira } from '../lib/format';
import { stockFor } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';
import { NoAccess } from '../components/NoAccess';

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

export default function ReceiveStock() {
  const params = useLocalSearchParams<{ product?: string }>();
  const { state, receiveStock } = useStore();
  const acc = useAccess();
  const seeCost = acc.can('seeCost');
  const [productId, setProductId] = useState(params.product ?? '');
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState('');
  const product = state.products.find((p) => p.id === productId);
  const [cost, setCost] = useState(product ? String(product.costPrice) : '');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');
  const [error, setError] = useState('');

  const pick = (id: string) => {
    setProductId(id);
    setCost(String(state.products.find((p) => p.id === id)?.costPrice ?? ''));
  };

  const n = toNumber(qty);
  const c = toNumber(cost);
  const line = product ? stockFor(state, product.id) : null;

  const save = () => {
    if (!product) return setError('Pick the product you received.');
    if (n <= 0) return setError('Enter how many came in.');
    if (seeCost && c <= 0) return setError('Enter the cost price per unit.');
    if (expiry && !/^\d{4}-\d{2}$/.test(expiry)) return setError('Write the expiry date as year-month, e.g. 2028-03.');
    // Without cost access the price isn't shown, so the product keeps its current cost price.
    receiveStock({ productId: product.id, qty: n, costPrice: seeCost ? c : product.costPrice, batch: batch.trim(), expiry });
    router.back();
  };

  const matches = state.products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  if (!acc.canEdit('stock')) return <NoAccess title="Receive stock" />;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Receive stock" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save stock" kind="accent" onPress={save} />
          </View>
        }
      >
        {product ? (
          <Card>
            <Text style={st.label}>Product</Text>
            <Pressable
              onPress={() => setProductId('')}
              style={st.picked}
              accessibilityRole="button"
              accessibilityLabel="Change product"
            >
              <View style={{ flex: 1 }}>
                <Text style={st.pickedName}>{product.name}</Text>
                <Muted>{product.pack}</Muted>
              </View>
              <Text style={st.change}>Change</Text>
            </Pressable>
          </Card>
        ) : (
          <Card style={{ paddingVertical: 8 }}>
            <Field label="Product" placeholder="Search products" value={search} onChangeText={setSearch} />
            {matches.slice(0, 8).map((p, i) => (
              <Row
                key={p.id}
                first={i === 0}
                title={p.name}
                sub={p.pack}
                onPress={() => pick(p.id)}
                rightSub={<Icon name="chev" color={colors.muted} />}
              />
            ))}
          </Card>
        )}

        <Card>
          <Field label="Quantity received" keyboardType="number-pad" value={qty} onChangeText={setQty} placeholder="0" />
          {product && line ? (
            <View style={st.now}>
              <Muted>Stock now {count(line.closing, product.unit)}</Muted>
              <Text style={st.after}>After this: {count(line.closing + n, product.unit)}</Text>
            </View>
          ) : null}
          {seeCost ? (
            <Field
              label={`Cost price per ${product?.unit ?? 'unit'}`}
              keyboardType="number-pad"
              value={cost}
              onChangeText={setCost}
              helper={product ? `Last time: ${naira(product.costPrice)}` : undefined}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="Batch no." value={batch} onChangeText={setBatch} autoCapitalize="characters" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Expiry (year-month)" value={expiry} onChangeText={setExpiry} placeholder="2028-03" />
            </View>
          </View>
          {seeCost ? (
            <View style={st.total}>
              <Text style={st.label}>Total cost</Text>
              <Text style={st.totalValue}>{naira(n * c)}</Text>
            </View>
          ) : null}
        </Card>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  pickedName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.navy },
  change: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.orangeText },
  now: { flexDirection: 'row', justifyContent: 'space-between' },
  after: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.green },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  totalValue: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
