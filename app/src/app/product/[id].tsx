import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { DeleteButton } from '../../components/DeleteButton';
import { Icon } from '../../components/Icon';
import { Button, Card, H2, LinkText, Muted, Row, Screen, TopBar } from '../../components/ui';
import { confirm } from '../../lib/confirm';
import { count, dayLabel, naira } from '../../lib/format';
import { inOut, promisedStock, shiftDay, stockFor } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { useAccess } from '../../lib/useAccess';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteStockMove, removeProduct } = useStore();
  const { canEdit, can, isAdmin } = useAccess();
  const p = state.products.find((x) => x.id === id);
  if (!p) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Product" back />
        <Screen>
          <Muted>This product was not found.</Muted>
        </Screen>
      </View>
    );
  }

  const line = stockFor(state, p.id);
  const profitEach = p.sellPrice - p.costPrice;
  const margin = p.sellPrice ? (profitEach / p.sellPrice) * 100 : 0;
  const latest = state.moves
    .filter((m) => m.productId === p.id && m.kind === 'received' && m.expiry)
    .sort((a, b) => (a.expiry ?? '').localeCompare(b.expiry ?? ''))[0];
  const waiting = promisedStock(state).get(p.id) ?? 0;
  const received = state.moves
    .filter((m) => m.productId === p.id && m.kind !== 'delivered')
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const sold = state.orders.some((o) => o.items.some((it) => it.productId === p.id));
  const dropEntry = async (m: (typeof received)[number]) => {
    const ok = await confirm(
      'Delete this stock entry?',
      `${count(m.qty, p.unit)} received ${dayLabel(m.day)} will be taken off the stock count. Use this for an entry typed by mistake.`,
    );
    if (ok) deleteStockMove(m.id);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={p.name} sub={`${p.group} · ${p.pack}`} back />
      <Screen
        footer={
          canEdit('stock') ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Button title="Count" kind="ghost" onPress={() => router.push(`/count-stock?product=${p.id}`)} />
              </View>
              <View style={{ flex: 3 }}>
                <Button
                  title="Receive stock"
                  kind="accent"
                  icon="plus"
                  onPress={() => router.push(`/receive-stock?product=${p.id}`)}
                />
              </View>
            </View>
          ) : undefined
        }
      >
        <Card>
          <H2>Today's stock</H2>
          <Muted>Worked out for you</Muted>
          <View style={st.sum}>
            <Part label="OPENING" value={line.opening} />
            <Text style={st.op}>+</Text>
            <Part label="RECEIVED" value={line.received} />
            <Text style={st.op}>−</Text>
            <Part label="DELIVERED" value={line.delivered} />
            <Text style={st.op}>=</Text>
            <Part label="CLOSING" value={line.closing} strong />
          </View>
          {line.adjusted ? (
            <Muted>
              Includes stock count changes today: {line.adjusted > 0 ? '+' : '−'}
              {Math.abs(line.adjusted)}.
            </Muted>
          ) : null}
          {waiting ? (
            <Text style={st.waiting}>
              {count(waiting, p.unit)} already sold, waiting for delivery. Free to sell: {count(line.closing - waiting, p.unit)}.
            </Text>
          ) : null}
          <Muted>Tonight's closing stock ({line.closing}) becomes tomorrow's opening stock.</Muted>
        </Card>

        {can('seeCost') ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2
              right={
                canEdit('stock') ? (
                  <LinkText onPress={() => router.push(`/edit-prices?product=${p.id}`)}>Edit prices</LinkText>
                ) : undefined
              }
            >
              Price & profit
            </H2>
            <Row first title="Cost price" right={`${naira(p.costPrice)} per ${p.unit}`} />
            <Row title="Selling price" right={`${naira(p.sellPrice)} per ${p.unit}`} />
            <Row title={`Profit per ${p.unit}`} sub={`${margin.toFixed(1)}% margin`} right={naira(profitEach)} />
            <Row title="Profit today" sub={`${count(line.delivered, p.unit)} sold`} right={naira(profitEach * line.delivered)} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 8 }}>
            <Row first title="Selling price" right={`${naira(p.sellPrice)} per ${p.unit}`} />
          </Card>
        )}

        <Card style={{ paddingVertical: 8 }}>
          <H2
            right={
              canEdit('stock') ? (
                <LinkText onPress={() => router.push(`/product-form?id=${p.id}`)}>Edit details</LinkText>
              ) : undefined
            }
          >
            Product info
          </H2>
          <Row first title="NAFDAC reg. no." right={p.nafdac || '—'} />
          <Row title="Supplier" right={p.supplier || '—'} />
          <Row title="Nearest expiry" right={latest ? `${latest.expiry} · batch ${latest.batch}` : 'Not recorded'} />
          <Row title="Warn me below" right={count(p.lowAt, p.unit)} />
        </Card>

        <Card>
          <H2 right={<LinkText onPress={() => router.push('/day-record')}>Full history</LinkText>}>Last 5 days</H2>
          <View style={st.tr}>
            <Text style={[st.th, { flex: 1, textAlign: 'left' }]}>Day</Text>
            <Text style={st.th}>Open</Text>
            <Text style={st.th}>In</Text>
            <Text style={st.th}>Out</Text>
            <Text style={st.th}>Close</Text>
          </View>
          {[0, 1, 2, 3, 4].map((n) => {
            const day = shiftDay(state.day, -n);
            const l = stockFor(state, p.id, day);
            return (
              <View key={day} style={st.tr}>
                <Text style={[st.td, { flex: 1, textAlign: 'left' }]}>{dayLabel(day).slice(0, 5)}</Text>
                <Text style={st.td}>{l.opening}</Text>
                <Text style={st.td}>+{inOut(l).in}</Text>
                <Text style={st.td}>−{inOut(l).out}</Text>
                <Text style={[st.td, { fontFamily: fonts.bodyBold }]}>{l.closing}</Text>
              </View>
            );
          })}
        </Card>

        {received.length ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2>Stock in and count changes</H2>
            {received.map((m, i) => (
              <Row
                key={m.id}
                first={i === 0}
                title={
                  m.kind === 'received'
                    ? `Received ${count(m.qty, p.unit)}${m.batch ? ` · batch ${m.batch}` : ''}`
                    : `${m.kind === 'added' ? '+' : '−'}${count(m.qty, p.unit)}${m.note ? ` · ${m.note}` : ''}`
                }
                sub={`${dayLabel(m.day)}${m.by ? ` · ${m.by}` : ''}`}
                onPress={isAdmin && m.kind === 'received' ? () => router.push(`/receive-stock?move=${m.id}`) : undefined}
                rightSub={
                  !isAdmin || m.kind !== 'received' ? undefined : (
                    <Pressable
                      onPress={() => dropEntry(m)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Delete this stock entry"
                      style={st.drop}
                    >
                      <Icon name="trash" size={18} color={colors.red} />
                    </Pressable>
                  )
                }
              />
            ))}
          </Card>
        ) : null}

        {isAdmin ? (
          <DeleteButton
            title={sold ? 'Hide this product' : 'Delete this product'}
            question={sold ? `Hide ${p.name}?` : `Delete ${p.name}?`}
            message={
              sold
                ? `${p.name} is in past sales, so it stays in those records and reports. It will no longer show in stock lists or new sales.`
                : `${p.name} and its stock counts will be removed from every phone. This can't be undone.`
            }
            yes={sold ? 'Hide' : 'Delete'}
            remove={() => removeProduct(p.id)}
          />
        ) : null}
      </Screen>
    </View>
  );
}

function Part({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={st.partLabel}>{label}</Text>
      <Text style={[st.partValue, strong && { color: colors.orangeText }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  waiting: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.orangeText },
  drop: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 30 },
  th: { width: 48, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  td: { width: 48, textAlign: 'right', fontFamily: fonts.body, fontSize: 14, color: colors.navy },
  sum: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 8 },
  op: { fontFamily: fonts.head, fontSize: 18, color: colors.muted, paddingBottom: 2 },
  partLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted, letterSpacing: 0.4 },
  partValue: { fontFamily: fonts.head, fontSize: 22, color: colors.navy },
});
