import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { Icon } from '../../components/Icon';
import { RiderAvatar } from '../../components/RiderAvatar';
import { Badge, Button, Card, Chips, Field, H2, Muted, Row, Screen, Stat, TopBar } from '../../components/ui';
import { RiderStatus } from '../../data/types';
import { dayLabel, naira } from '../../lib/format';
import { shiftDay } from '../../lib/stock';
import { periodOf, riderDays } from '../../lib/money';
import { bikeParts, riderNow, riderOwed } from '../../lib/riders';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { DocumentsCard } from '../../components/DocumentsCard';
import { DeleteButton } from '../../components/DeleteButton';
import { LoginCard } from '../../components/LoginCard';
import { SwitchRow } from '../../components/SwitchRow';
import { useAccess } from '../../lib/useAccess';
import { useWords } from '../../lib/words';

/** One rider, as Admin and Staff see them. */
export default function RiderInfo() {
  const { id, note } = useLocalSearchParams<{ id: string; note?: string }>();
  const { state, mode, updateRider, deleteRider, setRiderSignIn } = useStore();
  const acc = useAccess();
  const w = useWords();
  const r = state.riders.find((x) => x.id === id);
  const [rate, setRate] = useState(r ? String(r.ratePerDelivery) : '');

  if (!r || !acc.canView('riders')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title={w.Rider} back />
        <Screen>
          <Muted>This {w.rider} can't be found.</Muted>
        </Screen>
      </View>
    );
  }

  const now = riderNow(state, r);
  const bike = bikeParts(r.bike);
  const week = riderDays(state, r.id, periodOf('week', state.day)).reduce((s, d) => s + d.earned, 0);
  const owed = riderOwed(state, r.id);
  const newRate = Number(rate.replace(/[^\d]/g, '')) || 0;
  // Riders with deliveries or pay on record stay, so the records and reports stay right.
  const hasHistory = state.orders.some((o) => o.riderId === r.id) || state.expenses.some((e) => e.payee === r.id);

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title={r.name}
        back
        right={
          acc.canEdit('riders') ? (
            <Pressable
              onPress={() => router.push(`/add-rider?id=${r.id}`)}
              accessibilityRole="button"
              accessibilityLabel="Edit details"
              style={st.edit}
            >
              <Icon name="pen" size={20} />
            </Pressable>
          ) : undefined
        }
      />
      <Screen>
        <View style={st.head}>
          <RiderAvatar rider={r} size={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.name}>{r.name}</Text>
            <Badge kind={now.kind}>{now.label}</Badge>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Earned this week" value={naira(week)} />
          <Stat label="Owed now" value={naira(owed.owed)} note={`Paid so far ${naira(owed.paid)}`} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="See earnings" kind="ghost" icon="wallet" onPress={() => router.push('/rider-earnings')} />
          </View>
          {acc.canEdit('staffpay') ? (
            <View style={{ flex: 1 }}>
              <Button
                title={`Pay ${r.name.split(' ')[0]}`}
                kind="primary"
                icon="cash"
                onPress={() => router.push(`/pay?who=${r.id}`)}
              />
            </View>
          ) : null}
        </View>

        {acc.canEdit('riders') ? (
          <Card>
            <H2>Status</H2>
            <Chips<RiderStatus>
              options={[
                { value: 'active', label: 'Working' },
                { value: 'off_duty', label: 'Off duty' },
                { value: 'bike_repair', label: 'Bike in repair' },
              ]}
              value={r.status}
              onChange={(status) => updateRider(r.id, { status, statusSince: state.day })}
            />
            <Muted>
              {w.Riders} who are off duty or have a bike in repair can't be picked for a new {w.sale}.
            </Muted>
          </Card>
        ) : null}

        {r.changeRequest && acc.canEdit('riders') ? (
          <Card style={st.ask}>
            <H2>Asked you to change</H2>
            <Text style={st.askText}>"{r.changeRequest}"</Text>
            {r.changeRequestAt ? <Muted>Sent {dayLabel(r.changeRequestAt)}</Muted> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button title="Edit details" kind="primary" icon="pen" onPress={() => router.push(`/add-rider?id=${r.id}`)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Mark as done"
                  kind="ghost"
                  icon="check"
                  onPress={() => updateRider(r.id, { changeRequest: '', changeRequestAt: '' })}
                />
              </View>
            </View>
          </Card>
        ) : null}

        <Card style={{ paddingVertical: 4 }}>
          <Row first title="Phone" right={r.phone} />
          {r.phone2 ? <Row title="Other phone" right={r.phone2} /> : null}
          <Row title="Bike" right={bike.name} />
          <Row title="Plate number" right={bike.plate || '—'} />
          {r.bikeModel || r.bikeColour ? (
            <Row title="Make & colour" right={[r.bikeModel, r.bikeColour].filter(Boolean).join(', ')} />
          ) : null}
          {r.address ? <Row title="Address" right={r.address} /> : null}
          {r.idType ? <Row title="ID" right={[r.idType, r.idNumber].filter(Boolean).join(' · ')} /> : null}
          {r.joined ? <Row title="Joined" right={dayLabel(r.joined)} /> : null}
          <Row title="Pay per delivery" right={naira(r.ratePerDelivery)} />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <H2>Next of kin</H2>
          {r.kinName ? (
            <Row first title={r.kinName} sub={r.kinRelation} right={r.kinPhone} />
          ) : (
            <Muted style={{ paddingVertical: 8 }}>Not added yet. The {w.rider} can add it from their profile.</Muted>
          )}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <H2>Where to pay</H2>
          {r.payAccount ? (
            <Row first title={r.payBank ?? ''} sub={r.payName} right={r.payAccount} />
          ) : (
            <Muted style={{ paddingVertical: 8 }}>Not added yet. The {w.rider} can add it from their profile.</Muted>
          )}
          {r.payChanged && r.payChanged >= shiftDay(state.day, -14) ? (
            <View style={st.warn}>
              <Icon name="alert" size={18} color={colors.orangeText} />
              <Text style={st.warnText}>
                The {w.rider} changed this on {dayLabel(r.payChanged)}. Check it with them before the next payment.
              </Text>
            </View>
          ) : null}
        </Card>

        {acc.canEdit('riders') ? (
          <Card>
            <H2>Change pay per delivery</H2>
            <Field label="Pay per delivery" value={rate} onChangeText={setRate} keyboardType="number-pad" />
            <Button
              title="Save new rate"
              kind="ghost"
              disabled={newRate <= 0 || newRate === r.ratePerDelivery}
              onPress={() => updateRider(r.id, { ratePerDelivery: newRate })}
            />
            <Muted>The new rate counts for all of this rider's deliveries, including earlier ones.</Muted>
          </Card>
        ) : null}

        <DocumentsCard rider={r} canAdd={acc.canEdit('riders')} />

        {state.session?.role === 'admin' ? <LoginCard kind="rider" id={r.id} name={r.name} note={note} /> : null}

        {state.session?.role === 'admin' && (r.canSignIn !== undefined || mode === 'demo') ? (
          <Card>
            <SwitchRow
              label="Can sign in"
              sub={
                r.canSignIn === false
                  ? `Blocked: ${r.name.split(' ')[0]} can't use the app. Turn on to let them back in.`
                  : 'Turn off to block access as soon as their phone is online.'
              }
              value={r.canSignIn !== false}
              onChange={(on) => setRiderSignIn(r.id, on)}
            />
          </Card>
        ) : null}

        {state.session?.role === 'admin' ? (
          hasHistory ? (
            <Muted>
              {r.name.split(' ')[0]} has {w.sales} or pay on record, so they can't be deleted. To stop giving them deliveries, set
              them to Off duty.
            </Muted>
          ) : (
            <DeleteButton
              title={`Delete this ${w.rider}`}
              question={`Delete ${r.name}?`}
              message={`${r.name} will be removed from every phone, and their sign-in (if any) will stop working. This can't be undone.`}
              remove={() => deleteRider(r.id)}
            />
          )
        ) : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
  edit: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ask: { borderColor: colors.orange, borderWidth: 1.5 },
  askText: { fontFamily: fonts.body, fontSize: 15, color: colors.navy },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 10,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.orangeBg,
  },
  warnText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.orangeText },
});
