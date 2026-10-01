import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '../../components/Text';

import { AccessEditor } from '../../components/AccessEditor';
import { LoginCard } from '../../components/LoginCard';
import { SwitchRow } from '../../components/SwitchRow';
import { Avatar, Badge, Button, Card, Chips, Field, H2, LinkText, Muted, Screen, TopBar } from '../../components/ui';
import { Access, changeCount, describeChanges, NO_ACCESS, overridesFrom, withOverrides } from '../../data/access';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

/** Admin: one staff member's role, changes just for them, and whether they can sign in. */
export default function StaffAccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, saveStaffAccess } = useStore();
  const person = state.staff.find((x) => x.id === id);
  const [job, setJob] = useState(person?.job ?? '');
  const [roleId, setRoleId] = useState(person?.roleId ?? state.roles[0]?.id ?? '');
  const role = state.roles.find((r) => r.id === roleId);
  const [access, setAccess] = useState<Access>(() =>
    withOverrides(
      state.roles.find((r) => r.id === (person?.roleId ?? state.roles[0]?.id))?.access ?? NO_ACCESS,
      person?.overrides,
    ),
  );
  const [canSignIn, setCanSignIn] = useState(person?.canSignIn ?? true);

  if (!person || state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Staff access" back />
        <Screen>
          <Muted>Only Admin can change staff access.</Muted>
        </Screen>
      </View>
    );
  }

  const first = person.name.split(' ')[0];
  const overrides = role ? overridesFrom(role.access, access) : {};
  const changes = changeCount(overrides);

  const pickRole = (rid: string) => {
    setRoleId(rid);
    // A new role starts clean: its own access, with no changes for this person.
    setAccess(state.roles.find((r) => r.id === rid)?.access ?? NO_ACCESS);
  };

  const save = () => {
    saveStaffAccess(person.id, { job: job.trim() || person.job, roleId, overrides, canSignIn });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`${first}'s access`} back />
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            <Button title="Save access" kind="accent" icon="check" onPress={save} />
            <Muted style={{ textAlign: 'center' }}>Changes reach {first}'s phone next time it's online.</Muted>
          </View>
        }
      >
        <View style={st.head}>
          <Avatar initials={person.initials} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{person.name}</Text>
            <Muted>{person.phone}</Muted>
          </View>
          {canSignIn ? <Badge kind="green">Active</Badge> : <Badge kind="red">Blocked</Badge>}
        </View>

        <Field label="Job title" value={job} onChangeText={setJob} />

        <Card>
          <H2 right={<LinkText onPress={() => router.push('/roles')}>Staff roles</LinkText>}>Start from a role</H2>
          <Chips<string> options={state.roles.map((r) => ({ value: r.id, label: r.name }))} value={roleId} onChange={pickRole} />
          {changes ? (
            <View style={st.note}>
              <Text style={st.noteText}>
                {first} has {changes === 1 ? '1 change' : `${changes} changes`} from the {role?.name} role:{' '}
                {describeChanges(overrides)}.
              </Text>
              <LinkText onPress={() => setAccess(role?.access ?? NO_ACCESS)}>Undo changes</LinkText>
            </View>
          ) : (
            <Muted>{role?.summary}</Muted>
          )}
        </Card>

        <AccessEditor value={access} onChange={setAccess} who={first} />

        <LoginCard kind="staff" id={person.id} name={person.name} />

        <Card>
          <H2>Sign-in</H2>
          <SwitchRow
            label="Can sign in"
            sub={
              person.canSignIn === undefined
                ? 'No sign-in yet. Set an email and password above.'
                : 'Turn off to block access as soon as their phone is online.'
            }
            value={canSignIn}
            onChange={setCanSignIn}
          />
        </Card>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.head, fontSize: 18, color: colors.navy },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  note: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: colors.orangeBg },
  noteText: { fontFamily: fonts.body, fontSize: 13, color: colors.navy, lineHeight: 18 },
});
