import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Avatar, Badge, Button, Card, Chips, Field, IconTile, Muted, Row, Screen, Stat, TopBar } from '../components/ui';
import { count, naira } from '../lib/format';
import { bikeParts, riderNow } from '../lib/riders';
import { riderDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

export default function Riders() {
  const { state } = useStore();
  const acc = useAccess();
  const [tab, setTab] = useState<'riders' | 'bikes'>('riders');
  const [search, setSearch] = useState('');

  if (!acc.canView('riders')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Riders & bikes" back />
        <Screen>
          <Muted>Only Admin and Staff can see this.</Muted>
        </Screen>
      </View>
    );
  }

  const now = state.riders.map((r) => ({ r, now: riderNow(state, r) }));
  const q = search.trim().toLowerCase();
  const shown = now.filter(({ r }) => !q || r.name.toLowerCase().includes(q) || r.bike.toLowerCase().includes(q));
  const earnedToday = state.riders.reduce((s, r) => s + riderDay(state, r.id).earned, 0);
  const working = state.riders.filter((r) => riderDay(state, r.id).delivered > 0).length;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Riders & bikes" back />
      <Screen
        footer={
          acc.canEdit('riders') ? (
            <Button title="Add rider" kind="accent" icon="plus" onPress={() => router.push('/add-rider')} />
          ) : undefined
        }
      >
        <Chips<'riders' | 'bikes'>
          full
          options={[
            { value: 'riders', label: 'Riders' },
            { value: 'bikes', label: 'Bikes' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="Riders" value={String(state.riders.length)} />
          <Stat label="Out now" value={String(now.filter((x) => x.now.label === 'On delivery').length)} />
          <Stat label="Bikes in repair" value={String(state.riders.filter((r) => r.status === 'bike_repair').length)} />
        </View>

        <Pressable onPress={() => router.push('/rider-earnings')} accessibilityRole="button" style={st.link}>
          <IconTile name="wallet" />
          <View style={{ flex: 1 }}>
            <Text style={st.linkTitle}>Rider earnings by day</Text>
            <Muted>
              Today: {naira(earnedToday)} across {count(working, 'rider')}
            </Muted>
          </View>
          <Icon name="chev" color={colors.muted} />
        </Pressable>

        <Field label="Search" placeholder="Search rider or plate number" value={search} onChangeText={setSearch} />

        <Card style={{ paddingVertical: 4 }}>
          {shown.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No riders found.</Muted> : null}
          {shown.map(({ r, now: n }, i) => {
            const bike = bikeParts(r.bike);
            return tab === 'riders' ? (
              <Row
                key={r.id}
                first={i === 0}
                lead={<Avatar initials={r.initials} />}
                title={r.name}
                sub={[bike.name, bike.plate].filter(Boolean).join(' · ')}
                rightSub={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Badge kind={n.kind}>{n.label}</Badge>
                    <Muted>{n.note}</Muted>
                  </View>
                }
                onPress={() => router.push(`/rider-info/${r.id}`)}
              />
            ) : (
              <Row
                key={r.id}
                first={i === 0}
                lead={<IconTile name="bike" />}
                title={bike.name || 'Bike'}
                sub={[bike.plate, [r.bikeModel, r.bikeColour].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                rightSub={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {r.status === 'bike_repair' ? <Badge kind="red">In repair</Badge> : <Badge kind="green">Working</Badge>}
                    <Muted>{r.name.split(' ')[0]}</Muted>
                  </View>
                }
                onPress={() => router.push(`/rider-info/${r.id}`)}
              />
            );
          })}
        </Card>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
  },
  linkTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
});
