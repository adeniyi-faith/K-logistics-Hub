import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { OrderSummary } from '../../components/OrderSummary';
import { NoAccess } from '../../components/NoAccess';
import { Button, Card, Chips, Field, H2, LinkText, Muted, Screen, TopBar } from '../../components/ui';
import { Order } from '../../data/types';
import { naira } from '../../lib/format';
import { takeDeliveryPhoto } from '../../lib/photo';
import { orderTotal } from '../../lib/stock';
import { useStore } from '../../store/AppStore';
import { orderFor } from '../../lib/sales';
import { useAccess } from '../../lib/useAccess';
import { colors, fonts } from '../../theme';

type Method = NonNullable<Order['collected']>['method'];

const REASONS = ['Customer not around', 'Wrong address', 'Customer refused it', 'Customer cancelled', 'Other'];

export default function ConfirmDelivery() {
  const { id, fail } = useLocalSearchParams<{ id: string; fail?: string }>();
  const { state, mode, confirmDelivery, markFailed } = useStore();
  const acc = useAccess();
  const [failing, setFailing] = useState(fail === '1');
  const [reason, setReason] = useState(REASONS[0]);
  const [reasonNote, setReasonNote] = useState('');
  const order = state.orders.find((o) => o.id === id);
  const due = order ? orderTotal(order) : 0;
  const [method, setMethod] = useState<Method>(order?.payment === 'transfer' ? 'paid_before' : 'cash');
  const [amount, setAmount] = useState(order?.payment === 'transfer' ? '0' : String(due));
  const [receivedBy, setReceivedBy] = useState('');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const needPhoto = state.settings.requirePhoto;

  const snap = async () => {
    setTaking(true);
    setError('');
    try {
      const r = await takeDeliveryPhoto(mode === 'demo');
      if (r && 'error' in r) setError(r.error);
      else if (r) setPhoto(r.uri);
    } catch {
      setError('Could not take the photo. Please try again.');
    } finally {
      setTaking(false);
    }
  };

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

  // Riders confirm their own deliveries; Admin and staff who handle sales can do it for them.
  const mine = state.session?.role === 'rider' ? order.riderId === state.session.riderId : acc.canEdit('sales');
  if (!mine) return <NoAccess title="Confirm delivery" />;

  const done = order.status !== 'pending';

  const saveFailed = () => {
    const why = reason === 'Other' ? reasonNote.trim() : [reason, reasonNote.trim()].filter(Boolean).join(': ');
    if (!why) return setError('Write why it could not be delivered.');
    markFailed(order.id, why);
    router.back();
  };

  const confirm = () => {
    const paid = method === 'paid_before' ? 0 : Number(amount.replace(/[^\d]/g, '')) || 0;
    if (!receivedBy.trim()) return setError('Write the name of the person who received it.');
    if (method !== 'paid_before' && paid <= 0) return setError('Enter the amount you collected.');
    if (needPhoto && !photo) return setError('Add a photo of the delivery first.');
    confirmDelivery({ orderId: order.id, receivedBy: receivedBy.trim(), method, amount: paid, photo: photo ?? undefined });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={failing ? "Couldn't deliver" : 'Confirm delivery'} sub={`#${order.code} ${orderFor(order)}`} back />
      <Screen
        footer={
          done ? undefined : (
            <View style={{ gap: 8 }}>
              {error ? <Text style={st.error}>{error}</Text> : null}
              {failing ? (
                <Button title="Save: couldn't deliver" kind="danger" icon="x" onPress={saveFailed} />
              ) : (
                <Button title="Confirm delivered" kind="accent" icon="check" onPress={confirm} />
              )}
            </View>
          )
        }
      >
        <Card>
          <H2>Items to hand over</H2>
          <OrderSummary order={order} />
          <Muted>Phone {order.phone}</Muted>
        </Card>

        {order.status === 'failed' ? (
          <Card>
            <H2>Couldn't deliver</H2>
            <Muted>{order.failReason || 'No reason written.'}</Muted>
          </Card>
        ) : done ? (
          <Card>
            <H2>Delivered</H2>
            <Muted>
              Received by {order.receivedBy}
              {order.collected?.amount ? ` · collected ${naira(order.collected.amount)}` : ''}
            </Muted>
          </Card>
        ) : failing ? (
          <Card>
            <H2>Why couldn't it be delivered?</H2>
            <Chips<string> options={REASONS.map((r) => ({ value: r, label: r }))} value={reason} onChange={setReason} />
            <Field
              label={reason === 'Other' ? 'What happened?' : 'More detail (optional)'}
              value={reasonNote}
              onChangeText={(t) => (setError(''), setReasonNote(t))}
            />
            <Muted>Nothing leaves the stock. The office can try it again or delete it.</Muted>
            <LinkText onPress={() => (setError(''), setFailing(false))}>It was delivered after all</LinkText>
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
              {needPhoto ? (
                <View style={{ gap: 8 }}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={st.photo} resizeMode="cover" accessibilityLabel="Delivery photo" />
                  ) : null}
                  <Button
                    title={taking ? 'Opening…' : photo ? 'Change photo' : 'Add photo'}
                    kind={photo ? 'ghost' : 'primary'}
                    icon="camera"
                    onPress={snap}
                    disabled={taking}
                  />
                </View>
              ) : null}
            </Card>
            <LinkText onPress={() => (setError(''), setFailing(true))}>Couldn't deliver it?</LinkText>
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
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.grayBg },
  offline: { backgroundColor: colors.blueBg, borderRadius: 12, padding: 12 },
  offlineText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.blue },
});
