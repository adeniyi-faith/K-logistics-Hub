import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chips, Field, H2, Muted, Row, Screen, Stat, TopBar } from '../../components/ui';
import { RiderStatus } from '../../data/types';
import { dayLabel, naira } from '../../lib/format';
import { periodOf, riderDays } from '../../lib/money';
import { bikeParts, riderNow, riderOwed } from '../../lib/riders';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';
import { useAccess } from '../../lib/useAccess';

/** One rider, as Admin and Staff see them. */
export default function RiderInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, updateRider } = useStore();
  const acc = useAccess();
  const r = state.riders.find((x) => x.id === id);
  const [rate, setRate] = useState(r ? String(r.ratePerDelivery) : '');

  if (!r || !acc.canView('riders')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Rider" back />
        <Screen>
          <Muted>This rider can't be found.</Muted>
        </Screen>
      </View>
    );
  }

  const now = riderNow(state, r);
  const bike = bikeParts(r.bike);
  const week = riderDays(state, r.id, periodOf('week', state.day)).reduce((s, d) => s + d.earned, 0);
  const owed = riderOwed(state, r.id);
  const newRate = Number(rate.replace(/[^\d]/g, '')) || 0;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={r.name} back />
      <Screen>
        <View style={st.head}>
          <Avatar initials={r.initials} size={56} />
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
              <Button title="Pay rider" kind="primary" icon="cash" onPress={() => router.push(`/pay?who=${r.id}`)} />
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
            <Muted>Riders who are off duty or have a bike in repair can't be picked for a new sale.</Muted>
          </Card>
        ) : null}

        <Card style={{ paddingVertical: 4 }}>
          <Row first title="Phone" right={r.phone} />
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
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
});
