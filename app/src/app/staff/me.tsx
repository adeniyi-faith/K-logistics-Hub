import { StyleSheet, View } from 'react-native';

import { Text } from '../../components/Text';

import { SignedInMenu } from '../../components/SignedInMenu';
import { Avatar, Badge, Card, H2, Muted, Row, Screen, TopBar } from '../../components/ui';
import { naira } from '../../lib/format';
import { paidIn } from '../../lib/pay';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

/** A staff member's own details and pay. */
export default function Me() {
  const { state } = useStore();
  const me = state.staff.find((x) => x.id === state.session?.staffId);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Me" />
      <Screen>
        <View style={st.head}>
          <Avatar initials={me?.initials ?? state.session?.name.slice(0, 1) ?? ''} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.name}>{me?.name ?? state.session?.name}</Text>
            {me?.job ? <Muted>{me.job}</Muted> : null}
            <Badge kind="blue">Staff</Badge>
          </View>
        </View>

        {me ? (
          <Card style={{ paddingVertical: 4 }}>
            <H2>My pay</H2>
            <Row first title="Rate" right={`${naira(me.pay)} per ${me.payEvery}`} />
            <Row title="Paid this month" right={naira(paidIn(state, me.id, 'month'))} />
          </Card>
        ) : (
          <Muted>Your sign-in isn't linked to a staff record yet. Ask Admin.</Muted>
        )}

        <SignedInMenu />
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
});
