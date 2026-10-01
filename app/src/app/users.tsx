import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../components/Icon';
import { Avatar, Badge, Button, Card, Chips, H2, IconTile, Muted, Row, Screen, TopBar } from '../components/ui';
import { AREAS_LIST, changeCount, Level, NO_ACCESS, withOverrides } from '../data/access';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const CELL: Record<Level, { text: string; color: string }> = {
  edit: { text: 'Edit', color: colors.green },
  view: { text: 'View', color: colors.blue },
  off: { text: '—', color: '#9AA3B5' },
};

/** Admin: everyone who uses the app, and what each staff member can use. */
export default function Users() {
  const { state } = useStore();
  const [show, setShow] = useState<'all' | 'staff' | 'riders'>('all');

  if (state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Users & access" back />
        <Screen>
          <Muted>Only Admin can see this.</Muted>
        </Screen>
      </View>
    );
  }

  const staff = state.staff.filter((x) => x.active);
  const roleName = (id?: string) => state.roles.find((r) => r.id === id)?.name;
  const shown = staff.slice(0, 4);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Users & access" back />
      <Screen footer={<Button title="Add staff" kind="accent" icon="plus" onPress={() => router.push('/add-staff')} />}>
        <Muted>
          Three kinds of user: <Text style={st.b}>Admin</Text> (everything), <Text style={st.b}>Staff</Text> (what you allow) and{' '}
          <Text style={st.b}>Rider</Text> (own deliveries).
        </Muted>
        <Chips<'all' | 'staff' | 'riders'>
          options={[
            { value: 'all', label: `All (${1 + staff.length + state.riders.length})` },
            { value: 'staff', label: `Staff (${staff.length})` },
            { value: 'riders', label: `Riders (${state.riders.length})` },
          ]}
          value={show}
          onChange={setShow}
        />

        <Card style={{ paddingVertical: 4 }}>
          {show === 'all' ? (
            <Row
              first
              lead={<Avatar initials={state.session.name.slice(0, 1)} />}
              title={state.session.name}
              sub="You"
              rightSub={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Badge kind="blue">Admin</Badge>
                  <Muted>Full access</Muted>
                </View>
              }
            />
          ) : null}
          {show !== 'riders'
            ? staff.map((x, i) => {
                const n = changeCount(x.overrides);
                return (
                  <Row
                    key={x.id}
                    first={show === 'staff' && i === 0}
                    lead={<Avatar initials={x.initials} />}
                    title={x.name}
                    sub={roleName(x.roleId) ? `${roleName(x.roleId)} access` : 'No access yet'}
                    rightSub={
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        {x.canSignIn === false ? <Badge kind="red">Blocked</Badge> : <Badge kind="gray">Staff</Badge>}
                        {n ? <Text style={st.changes}>+ {n === 1 ? '1 change' : `${n} changes`}</Text> : null}
                      </View>
                    }
                    onPress={() => router.push(`/staff-access/${x.id}`)}
                  />
                );
              })
            : null}
          {show === 'riders' ? (
            state.riders.map((r, i) => (
              <Row
                key={r.id}
                first={i === 0}
                lead={<Avatar initials={r.initials} />}
                title={r.name}
                sub="Rider app: own deliveries only"
                rightSub={<Badge kind="gray">Rider</Badge>}
                onPress={() => router.push(`/rider-info/${r.id}`)}
              />
            ))
          ) : show === 'all' ? (
            <Row
              lead={<IconTile name="bike" />}
              title={`${state.riders.length} riders`}
              sub="Use the Rider app · deliveries only"
              rightSub={<Icon name="chev" color={colors.muted} />}
              onPress={() => setShow('riders')}
            />
          ) : null}
        </Card>

        <Button title="Staff roles" kind="ghost" icon="shield" onPress={() => router.push('/roles')} />

        {shown.length ? (
          <Card style={{ gap: 0 }}>
            <H2>Compare staff access</H2>
            <View style={[st.cmp, { paddingTop: 8 }]}>
              <Text style={[st.head, { flex: 1.5 }]}>Area</Text>
              {shown.map((x) => (
                <Text key={x.id} style={[st.head, st.cell]} numberOfLines={1}>
                  {x.name.split(' ')[0]}
                </Text>
              ))}
            </View>
            {AREAS_LIST.map((a) => (
              <View key={a.value} style={[st.cmp, st.border]}>
                <Text style={[st.area, { flex: 1.5 }]}>{a.short}</Text>
                {shown.map((x) => {
                  const lvl = withOverrides(state.roles.find((r) => r.id === x.roleId)?.access ?? NO_ACCESS, x.overrides).areas[
                    a.value
                  ];
                  return (
                    <Text key={x.id} style={[st.cell, st.lvl, { color: CELL[lvl].color }]}>
                      {CELL[lvl].text}
                    </Text>
                  );
                })}
              </View>
            ))}
            <Muted style={{ paddingTop: 8 }}>Two people can hold the same job title and still have different access.</Muted>
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  b: { fontFamily: fonts.bodyBold, color: colors.navy },
  changes: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.orangeText },
  cmp: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  head: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  cell: { flex: 1, textAlign: 'center' },
  area: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.navy },
  lvl: { fontFamily: fonts.bodyBold, fontSize: 12 },
});
