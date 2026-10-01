import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { SignedInMenu } from '../../components/SignedInMenu';
import { Avatar, Badge, Card, H2, Muted, Row, Screen, TopBar } from '../../components/ui';
import { AREAS_LIST, changeCount, Level, PERMS_LIST } from '../../data/access';
import { naira } from '../../lib/format';
import { paidIn } from '../../lib/pay';
import { useAccess } from '../../lib/useAccess';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

const LOOK: Record<Level, { text: string; kind: 'green' | 'blue' | 'gray' }> = {
  edit: { text: 'Can add & change', kind: 'green' },
  view: { text: 'View only', kind: 'blue' },
  off: { text: 'Hidden', kind: 'gray' },
};

/** A staff member's own access and pay. */
export default function Me() {
  const { state } = useStore();
  const { access } = useAccess();
  const me = state.staff.find((x) => x.id === state.session?.staffId);
  const role = state.roles.find((r) => r.id === me?.roleId);
  const n = changeCount(me?.overrides);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Me" />
      <Screen>
        <View style={st.head}>
          <Avatar initials={me?.initials ?? state.session?.name.slice(0, 1) ?? ''} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.name}>{me?.name ?? state.session?.name}</Text>
            {me?.job ? <Muted>{me.job}</Muted> : null}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Badge kind="blue">Staff</Badge>
              {role ? (
                <Badge kind="amber">{`${role.name} access${n ? ` + ${n === 1 ? '1 change' : `${n} changes`}` : ''}`}</Badge>
              ) : null}
            </View>
          </View>
        </View>

        <Card style={{ paddingVertical: 4 }}>
          <H2>What I can use</H2>
          {AREAS_LIST.map((a, i) => (
            <Row
              key={a.value}
              first={i === 0}
              title={a.label}
              rightSub={<Badge kind={LOOK[access.areas[a.value]].kind}>{LOOK[access.areas[a.value]].text}</Badge>}
            />
          ))}
        </Card>

        <Card style={{ gap: 6 }}>
          <H2>Extra permissions</H2>
          {PERMS_LIST.map((p) => {
            const ok = access.perms[p.value];
            return (
              <View key={p.value} style={st.perm}>
                <Icon name={ok ? 'check' : 'x'} size={18} color={ok ? colors.green : '#9AA3B5'} />
                <Text style={[st.permText, !ok && { color: colors.muted }]}>{p.label}</Text>
              </View>
            );
          })}
        </Card>

        <View style={st.note}>
          <Icon name="shield" size={20} color={colors.blue} />
          <Text style={st.noteText}>Need more access? Ask Admin. Changes reach your phone the next time it syncs.</Text>
        </View>

        {me ? (
          <Card style={{ paddingVertical: 4 }}>
            <H2>My pay</H2>
            <Row first title="Rate" right={`${naira(me.pay)} per ${me.payEvery}`} />
            <Row title="Paid this month" right={naira(paidIn(state, me.id, 'month'))} />
          </Card>
        ) : (
          <Muted>Your sign-in isn't linked to a staff record yet, so you have no access. Ask Admin.</Muted>
        )}

        <SignedInMenu />
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
  perm: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  permText: { fontFamily: fonts.body, fontSize: 14, color: colors.navy },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: colors.blueBg },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.navy, lineHeight: 18 },
});
