import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, Field, H2, Muted, Screen, TopBar } from '../components/ui';
import { naira } from '../lib/format';
import { useAccess } from '../lib/useAccess';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;
/** The lists from Business settings, plus the product's own value if it was removed from the list since. */
const withCurrent = (list: string[], current?: string) => (current && !list.includes(current) ? [...list, current] : list);

/** Add a product, or (with ?id=) change a product's details. */
export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, addProduct, updateProduct } = useStore();
  const acc = useAccess();
  const s = state.settings;
  const old = id ? state.products.find((p) => p.id === id) : undefined;
  const [name, setName] = useState(old?.name ?? '');
  const [group, setGroup] = useState(old?.group ?? s.productGroups[0] ?? '');
  const [unit, setUnit] = useState(old?.unit ?? s.defaultUnit);
  const [pack, setPack] = useState(old?.pack ?? '');
  const [cost, setCost] = useState(old ? String(old.costPrice) : '');
  const [sell, setSell] = useState(old ? String(old.sellPrice) : '');
  const [lowAt, setLowAt] = useState(String(old?.lowAt ?? s.lowStockAt));
  const [nafdac, setNafdac] = useState(old?.nafdac ?? '');
  const [supplier, setSupplier] = useState(old?.supplier ?? '');
  const [error, setError] = useState('');
  const seeCost = acc.can('seeCost');
  const title = old ? 'Edit product' : 'Add a product';

  // Adding a product needs its cost price, so it needs the "see cost prices" permission too.
  if (!acc.canEdit('stock') || (!old && !seeCost) || (id && !old)) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title={title} back />
        <Screen>
          <Muted>{id && !old ? 'This product was not found.' : 'Only Admin can add products.'}</Muted>
        </Screen>
      </View>
    );
  }

  const c = toNumber(cost);
  const sp = toNumber(sell);
  const clear = (fn: (t: string) => void) => (t: string) => {
    setError('');
    fn(t);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return setError('Enter the product name.');
    if (state.products.some((p) => p.id !== old?.id && p.name.toLowerCase() === n.toLowerCase()))
      return setError('There is already a product with this name.');
    if (seeCost && c <= 0) return setError('Enter the cost price.');
    if (sp <= 0) return setError('Enter the selling price.');
    const details = {
      name: n,
      group,
      unit,
      pack: pack.trim() || unit,
      sellPrice: sp,
      lowAt: toNumber(lowAt),
      nafdac: nafdac.trim(),
      supplier: supplier.trim(),
      ...(seeCost ? { costPrice: c } : {}),
    };
    if (old) {
      updateProduct(old.id, details);
      router.back();
      return;
    }
    const newId = await addProduct({ ...details, costPrice: c });
    router.replace(`/product/${newId}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title} sub={old?.name} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title={old ? 'Save changes' : 'Save product'} kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <Card>
          <H2>Product</H2>
          <Field label="Product name" value={name} onChangeText={clear(setName)} placeholder="e.g. Ginger herbal tea" />
          <Text style={st.label}>Group</Text>
          <Chips<string>
            options={withCurrent(s.productGroups, old?.group).map((g) => ({ value: g, label: g }))}
            value={group}
            onChange={setGroup}
          />
          <Text style={st.label}>Unit</Text>
          <Chips<string>
            options={withCurrent(s.units, old?.unit).map((u) => ({ value: u, label: u }))}
            value={unit}
            onChange={setUnit}
          />
          <Field label="What one unit is (optional)" value={pack} onChangeText={setPack} placeholder="e.g. Box of 20 tea bags" />
          <Muted>Change the lists of groups and units in Business settings.</Muted>
        </Card>

        <Card>
          <H2>Price</H2>
          {seeCost ? (
            <Field label={`Cost price per ${unit}`} value={cost} onChangeText={clear(setCost)} keyboardType="number-pad" />
          ) : null}
          <Field label={`Selling price per ${unit}`} value={sell} onChangeText={clear(setSell)} keyboardType="number-pad" />
          {seeCost && c > 0 && sp > 0 ? (
            <Muted>
              Profit per {unit}: {naira(sp - c)}
            </Muted>
          ) : null}
          <Field label="Warn me when stock falls to" value={lowAt} onChangeText={setLowAt} keyboardType="number-pad" />
        </Card>

        <Card>
          <H2>Product info</H2>
          <Field label="NAFDAC reg. no. (optional)" value={nafdac} onChangeText={setNafdac} autoCapitalize="characters" />
          <Field label="Supplier (optional)" value={supplier} onChangeText={setSupplier} />
        </Card>

        {old ? null : <Muted>A new product starts with nothing in the store. Use Receive stock to add some.</Muted>}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
