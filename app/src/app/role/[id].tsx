import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { AccessEditor } from '../../components/AccessEditor';
import { Button, Field, Muted, Screen, TopBar } from '../../components/ui';
import { Access, NO_ACCESS } from '../../data/access';
import { uuid } from '../../lib/id';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

/** Admin: change a staff role, or create one (id "new"). */
export default function RoleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, saveRole } = useStore();
  const role = state.roles.find((r) => r.id === id);
  const [name, setName] = useState(role?.name ?? '');
  const [summary, setSummary] = useState(role?.summary ?? '');
  const [access, setAccess] = useState<Access>(role?.access ?? NO_ACCESS);
  const [error, setError] = useState('');

  if (state.session?.role !== 'admin' || (id !== 'new' && !role)) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Staff role" back />
        <Screen>
          <Muted>Only Admin can change staff roles.</Muted>
        </Screen>
      </View>
    );
  }

  const people = role ? state.staff.filter((x) => x.active && x.roleId === role.id).length : 0;
  const save = () => {
    if (!name.trim()) return setError('Give the role a name, e.g. Dispatch.');
    saveRole({ id: role?.id ?? uuid(), name: name.trim(), summary: summary.trim(), access });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={role ? `${role.name} role` : 'New staff role'} back />
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save role" kind="accent" icon="check" onPress={save} />
            {people ? (
              <Muted style={{ textAlign: 'center' }}>
                This updates {people === 1 ? '1 person' : `${people} people`}, except things changed just for them.
              </Muted>
            ) : null}
          </View>
        }
      >
        <Field label="Role name" value={name} onChangeText={(t) => (setError(''), setName(t))} placeholder="e.g. Dispatch" />
        <Field label="What this role does" value={summary} onChangeText={setSummary} placeholder="One line about the job" />
        <AccessEditor value={access} onChange={setAccess} who="this role" />
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
