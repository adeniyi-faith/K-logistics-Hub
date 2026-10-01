import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OrderSummary } from '../../components/OrderSummary';
import { Button, Card, Chips, Field, H2, Muted, Screen, TopBar } from '../../components/ui';
import { Order } from '../../data/types';
import { naira } from '../../lib/format';
import { orderTotal } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

type Method = NonNullable<Order['collected']>['method'];

export default function ConfirmDelivery() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, confirmDelivery } = useStore();
  const order = state.orders.find((o) => o.id === id);
  const due = order ? orderTotal(order) : 0;
  const [method, setMethod] = useState<Method>(order?.payment === 'transfer' ? 'paid_before' : 'cash');
  const [amount, setAmount] = useState(order?.payment === 'transfer' ? '0' : String(due));
  const [receivedBy, setReceivedBy] = useState('');
  const [error, setError] = useState('');

  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Confirm delivery" back />
        <Screen>
          <Muted>This delivery was not found.</Muted>
        </Screen>
      </View>
    );
  }

  const done = order.status !== 'pending';

  const confirm = () => {
    const paid = method === 'paid_before' ? 0 : Number(amount.replace(/[^\d]/g, '')) || 0;
    if (!receivedBy.trim()) return setError('Write the name of the person who received it.');
    if (method !== 'paid_before' && paid <= 0) return setError('Enter the amount you collected.');
    confirmDelivery({ orderId: order.id, receivedBy: receivedBy.trim(), method, amount: paid });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Confirm delivery" sub={`#${order.id} ${order.customer}`} back />
      <Screen
        footer={
          done ? undefined : (
            <View style={{ gap: 8 }}>
              {error ? <Text style={st.error}>{error}</Text> : null}
              <Button title="Confirm delivered" kind="accent" icon="check" onPress={confirm} />
            </View>
          )
        }
      >
        <Card>
          <H2>Items to hand over</H2>
          <OrderSummary order={order} />
          <Muted>Phone {order.phone}</Muted>
        </Card>

        {done ? (
          <Card>
            <H2>Delivered</H2>
            <Muted>
              Received by {order.receivedBy}
              {order.collected?.amount ? ` · collected ${naira(order.collected.amount)}` : ''}
            </Muted>
          </Card>
        ) : (
          <>
            <Card>
              <H2>Payment collected</H2>
              <Chips
                full
                value={method}
                onChange={(m) => {
                  setMethod(m);
                  setAmount(m === 'paid_before' ? '0' : String(due));
                }}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'transfer', label: 'Transfer' },
                  { value: 'paid_before', label: 'Paid before' },
                ]}
              />
              {method !== 'paid_before' ? (
                <Field
                  label="Amount collected"
                  keyboardType="number-pad"
                  value={amount}
                  onChangeText={setAmount}
                  helper={`Amount due: ${naira(due)}`}
                />
              ) : null}
            </Card>
            <Card>
              <H2>Proof of delivery</H2>
              <Field label="Received by" value={receivedBy} onChangeText={setReceivedBy} placeholder="Name of the person" />
              <Muted>Photo and signature come in the next step.</Muted>
            </Card>
            <View style={st.offline}>
              <Text style={st.offlineText}>
                No internet here? That's fine. This delivery is saved on your phone and will upload by itself.
              </Text>
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  offline: { backgroundColor: colors.blueBg, borderRadius: 12, padding: 12 },
  offlineText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.blue },
});
