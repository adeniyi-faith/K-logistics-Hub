import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Button, Card, IconTile, LinkText, Muted, Screen, TopBar } from '../components/ui';
import { AREAS_LIST, PERMS_LIST } from '../data/access';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Admin: the ready-made sets of access given to staff. */
export default function Roles() {
  const { state } = useStore();

  if (state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Staff roles" back />
        <Screen>
          <Muted>Only Admin can see this.</Muted>
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Staff roles" back />
      <Screen>
        <Muted>
          A staff role is a ready-made set of access. Give one to a staff member, then turn single things on or off just for them.
          Admin and Rider access are fixed.
        </Muted>
        {state.roles.map((r) => {
          const people = state.staff.filter((x) => x.active && x.roleId === r.id).length;
          const pills = [
            ...AREAS_LIST.filter((a) => r.access.areas[a.value] !== 'off').map((a) => `${a.short}: ${r.access.areas[a.value]}`),
            ...PERMS_LIST.filter((p) => r.access.perms[p.value]).map((p) => p.label),
          ];
          return (
            <Card key={r.id} style={{ gap: 10 }}>
              <View style={st.top}>
                <IconTile name="shield" bg="#EEF1F8" fg={colors.navy} />
                <View style={{ flex: 1 }}>
                  <Text style={st.name}>{r.name}</Text>
                  <Muted>{people === 1 ? '1 person' : `${people} people`}</Muted>
                </View>
                <LinkText onPress={() => router.push(`/role/${r.id}`)}>Edit</LinkText>
              </View>
              {r.summary ? <Text style={st.summary}>{r.summary}</Text> : null}
              <View style={st.pills}>
                {pills.map((p) => (
                  <Text key={p} style={st.pill}>
                    {p}
                  </Text>
                ))}
              </View>
            </Card>
          );
        })}
        <Button title="Create a staff role" kind="ghost" icon="plus" onPress={() => router.push('/role/new')} />
        <Muted style={{ textAlign: 'center' }}>
          Changing a role updates everyone who has it, except the things you changed for one person.
        </Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.navy },
  summary: { fontFamily: fonts.body, fontSize: 13, color: colors.navy, lineHeight: 18 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
  },
});
