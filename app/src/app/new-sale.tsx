import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Button, Card, Chips, Field, H2, LinkText, Muted, Row, Screen, TopBar } from '../components/ui';
import { Order } from '../data/types';
import { useWords } from '../lib/words';
import { count, dayLabel, naira } from '../lib/format';
import { lastRiderFor } from '../lib/sales';
import { stockFor } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';
import { NoAccess } from '../components/NoAccess';

type Line = { productId: string; qty: number };

export default function NewSale() {
  const params = useLocalSearchParams<{ customer?: string; rider?: string }>();
  const { state, createSale } = useStore();
  const w = useWords();
  const acc = useAccess();

  const [customerId, setCustomerId] = useState(params.customer ?? '');
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const picked = state.customers.find((c) => c.id === customerId);

  const [lines, setLines] = useState<Line[]>([]);
  const [adding, setAdding] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const last = picked ? lastRiderFor(state, picked.id) : null;
  const [riderId, setRiderId] = useState(
    params.rider ?? last?.riderId ?? state.riders.find((r) => r.status === 'active')?.id ?? '',
  );
  const [area, setArea] = useState(picked?.area ?? '');
  const [address, setAddress] = useState(picked?.address ?? '');
  const [payment, setPayment] = useState<Order['payment']>('on_delivery');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Units already promised to orders that are not delivered yet.
  const promised = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of state.orders) {
      if (o.status !== 'pending') continue;
      for (const it of o.items) m.set(it.productId, (m.get(it.productId) ?? 0) + it.qty);
    }
    return m;
  }, [state.orders]);
  const available = (productId: string) => stockFor(state, productId).closing - (promised.get(productId) ?? 0);

  const product = (id: string) => state.products.find((p) => p.id === id);
  const total = lines.reduce((s, l) => s + l.qty * (product(l.productId)?.sellPrice ?? 0), 0);

  const pickCustomer = (id: string) => {
    const c = state.customers.find((x) => x.id === id);
    setCustomerId(id);
    setIsNew(false);
    setArea(c?.area ?? '');
    setAddress(c?.address ?? '');
    const lr = lastRiderFor(state, id);
    if (lr && !params.rider) setRiderId(lr.riderId);
  };

  const setQty = (productId: string, qty: number) =>
    setLines((ls) =>
      qty <= 0 ? ls.filter((l) => l.productId !== productId) : ls.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    );

  const save = async () => {
    if (!picked && !(isNew && name.trim())) return setError('Pick a customer, or add a new one with their name.');
    if (!lines.length) return setError('Add at least one product.');
    const short = lines.find((l) => l.qty > available(l.productId));
    if (short && !state.settings.allowZeroStock)
      return setError(`Not enough ${product(short.productId)?.name} in stock (${available(short.productId)} left).`);
    if (!riderId) return setError(`Pick a ${w.rider}.`);
    if (!area) return setError('Pick the delivery area.');
    setSaving(true);
    const id = await createSale({
      customerId: picked?.id,
      newCustomer: picked ? undefined : { name: name.trim(), phone: phone.trim() },
      area,
      address: address.trim(),
      riderId,
      payment,
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: product(l.productId)?.sellPrice ?? 0 })),
    });
    router.replace(`/order/${id}`);
  };

  const customerMatches = state.customers.filter((c) =>
    [c.name, c.phone.replace(/\s/g, ''), c.area].some((f) => f.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const productMatches = state.products.filter(
    (p) => !lines.some((l) => l.productId === p.id) && p.name.toLowerCase().includes(productSearch.trim().toLowerCase()),
  );
  const lastRider = last ? state.riders.find((r) => r.id === last.riderId) : null;

  if (!acc.canEdit('sales')) return <NoAccess title={`New ${w.sale}`} />;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`New ${w.sale}`} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            <View style={st.totalRow}>
              <Text style={st.totalLabel}>Total</Text>
              <Text style={st.total}>{naira(total)}</Text>
            </View>
            {payment === 'on_delivery' && total ? (
              <Muted>
                {w.Rider} collects {naira(total)} on delivery.
              </Muted>
            ) : null}
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title={saving ? 'Saving…' : `Save ${w.sale}`} kind="accent" onPress={save} disabled={saving} />
          </View>
        }
      >
        <Card style={picked ? undefined : { paddingVertical: 8 }}>
          <H2
            right={picked || isNew ? <LinkText onPress={() => (setCustomerId(''), setIsNew(false))}>Change</LinkText> : undefined}
          >
            Customer
          </H2>
          {picked ? (
            <View style={{ gap: 2 }}>
              <Text style={st.big}>{picked.name}</Text>
              <Muted>
                {picked.phone} · {picked.area}
              </Muted>
            </View>
          ) : isNew ? (
            <>
              <Field label="Customer name" value={name} onChangeText={setName} />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </>
          ) : (
            <>
              <Field label="Find a customer" placeholder="Name, phone or area" value={search} onChangeText={setSearch} />
              {customerMatches.slice(0, 6).map((c, i) => (
                <Row
                  key={c.id}
                  first={i === 0}
                  title={c.name}
                  sub={`${c.phone} · ${c.area}`}
                  onPress={() => pickCustomer(c.id)}
                />
              ))}
              <Row title="+ New customer" onPress={() => setIsNew(true)} />
            </>
          )}
        </Card>

        <Card>
          <H2>Items</H2>
          {lines.map((l) => {
            const p = product(l.productId);
            if (!p) return null;
            return (
              <View key={l.productId} style={st.line}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.lineName}>{p.name}</Text>
                  <Muted>
                    {naira(p.sellPrice)} each · {count(available(p.id), p.unit)} in stock
                  </Muted>
                  <Muted>
                    {l.qty} × {naira(p.sellPrice)} = {naira(l.qty * p.sellPrice)}
                  </Muted>
                </View>
                <Stepper value={l.qty} onChange={(q) => setQty(p.id, q)} />
              </View>
            );
          })}
          {adding ? (
            <View style={{ gap: 4 }}>
              <Field label="Add product" placeholder="Search products" value={productSearch} onChangeText={setProductSearch} />
              {productMatches.slice(0, 6).map((p, i) => (
                <Row
                  key={p.id}
                  first={i === 0}
                  title={p.name}
                  sub={`${naira(p.sellPrice)} · ${count(available(p.id), p.unit)} in stock`}
                  onPress={() => {
                    setLines((ls) => [...ls, { productId: p.id, qty: 1 }]);
                    setAdding(false);
                    setProductSearch('');
                  }}
                />
              ))}
            </View>
          ) : (
            <Button title="Add product" kind="ghost" icon="plus" onPress={() => setAdding(true)} />
          )}
        </Card>

        <Card>
          <H2>Delivery</H2>
          {lastRider && last ? (
            <View style={st.hint}>
              <Text style={st.hintText}>
                Last delivered to this customer by {lastRider.name} ({lastRider.bike.split(' · ')[0]}) on {dayLabel(last.day)}.
                Same {w.rider} picked for you.
              </Text>
            </View>
          ) : null}
          <Text style={st.label}>{w.Rider} & bike</Text>
          <Chips
            value={riderId}
            onChange={setRiderId}
            options={state.riders
              // Riders who are off duty or have a bike in repair can't be given deliveries.
              .filter((r) => r.status === 'active' || r.id === riderId)
              .map((r) => ({ value: r.id, label: `${r.name.split(' ')[0]} · ${r.bike.split(' · ')[0]}` }))}
          />
          <Text style={st.label}>Delivery area</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chips
              value={area}
              onChange={setArea}
              options={[...new Set([...state.settings.areas, ...(area ? [area] : [])])].map((a) => ({ value: a, label: a }))}
            />
          </ScrollView>
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street and landmark" />
        </Card>

        <Card>
          <H2>Payment</H2>
          <Chips
            full
            value={payment}
            onChange={setPayment}
            options={[
              { value: 'transfer', label: 'Paid by transfer' },
              { value: 'on_delivery', label: 'Pay on delivery' },
            ]}
          />
        </Card>
      </Screen>
    </View>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={st.stepper}>
      <Pressable onPress={() => onChange(value - 1)} style={st.stepBtn} accessibilityLabel="One less">
        <Icon name="minus" />
      </Pressable>
      <Text style={st.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} style={st.stepBtn} accessibilityLabel="One more">
        <Icon name="plus" />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  big: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lineName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.inputLine, borderRadius: 12 },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 28, textAlign: 'center', fontFamily: fonts.head, fontSize: 16, color: colors.navy },
  hint: { backgroundColor: colors.blueBg, borderRadius: 12, padding: 12 },
  hintText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.blue },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  total: { fontFamily: fonts.head, fontSize: 22, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
