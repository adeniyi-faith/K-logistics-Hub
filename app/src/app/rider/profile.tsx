import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { RiderAvatar } from '../../components/RiderAvatar';
import { SignedInMenu } from '../../components/SignedInMenu';
import { Badge, Button, Card, H2, Row, Screen, TopBar } from '../../components/ui';
import { dayLabel, naira } from '../../lib/format';
import { periodOf, riderDays } from '../../lib/money';
import { bikeParts, riderNow } from '../../lib/riders';
import { riderDay } from '../../lib/stock';
import { useWords } from '../../lib/words';
import { useStore } from '../../store/AppStore';
import { colors, fonts } from '../../theme';

/** The rider's own profile. */
export default function RiderProfile() {
  const { state } = useStore();
  const w = useWords();
  const rider = state.riders.find((r) => r.id === state.session?.riderId);
  if (!rider) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="My profile" />
        <Screen>
          <SignedInMenu />
        </Screen>
      </View>
    );
  }

  const now = riderNow(state, rider);
  const bike = bikeParts(rider.bike);
  const today = riderDay(state, rider.id).earned;
  const week = riderDays(state, rider.id, periodOf('week', state.day)).reduce((s, d) => s + d.earned, 0);
  const masked = rider.payAccount ? `${rider.payBank ?? ''} · ****${rider.payAccount.slice(-4)}` : 'Not added yet';

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="My profile" />
      <Screen>
        <View style={st.head}>
          <RiderAvatar rider={rider} size={80} />
          <Text style={st.name}>{rider.name}</Text>
          <View>
            <Badge kind={rider.status === 'active' ? 'green' : now.kind}>
              {rider.status === 'active' ? `Active ${w.rider}` : now.label}
            </Badge>
          </View>
        </View>
        <Button title="Edit my profile" kind="ghost" icon="pen" onPress={() => router.push('/rider-edit')} />

        <Card style={{ paddingVertical: 4 }}>
          <H2>My details</H2>
          <Row first title="Phone" right={rider.phone} />
          {rider.address ? <Row title="Address" right={rider.address} /> : null}
          <Row
            title="Next of kin"
            right={rider.kinName ? [rider.kinName, rider.kinPhone].filter(Boolean).join(' · ') : 'Not added yet'}
          />
          {rider.joined ? <Row title="Joined" right={dayLabel(rider.joined)} /> : null}
          {rider.idType ? <Row title="ID" right={rider.idType} /> : null}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <H2>My bike</H2>
          <Row first title="Bike" right={[bike.name, rider.bikeModel].filter(Boolean).join(' · ')} />
          <Row title="Plate number" right={bike.plate || '—'} />
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          <H2>My pay</H2>
          <Row first title="Rate" right={`${naira(rider.ratePerDelivery)} per delivery`} />
          <Row title="Earned today" right={naira(today)} />
          <Row title="Earned this week" right={naira(week)} />
          <Row title="Paid into" right={masked} />
        </Card>

        <SignedInMenu />
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  head: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  name: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
});
