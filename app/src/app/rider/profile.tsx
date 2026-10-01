import { View } from 'react-native';

import { ComingNext, SignedInMenu } from '../../components/SignedInMenu';
import { Avatar, Card, H2, Row, Screen, TopBar } from '../../components/ui';
import { naira } from '../../lib/format';
import { useStore } from '../../store/AppStore';

export default function RiderProfile() {
  const { state } = useStore();
  const rider = state.riders.find((r) => r.id === state.session?.riderId);
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Profile" />
      <Screen>
        <Card style={{ paddingVertical: 8 }}>
          <Row first lead={<Avatar initials={rider?.initials ?? '?'} size={48} />} title={rider?.name ?? ''} sub={rider?.bike} />
        </Card>
        <Card style={{ paddingVertical: 8 }}>
          <H2>My details</H2>
          <Row first title="Phone" right={rider?.phone} />
          <Row title="Pay per delivery" right={naira(rider?.ratePerDelivery ?? 0)} />
        </Card>
        <ComingNext what="Editing your own photo, phone, address, next of kin and pay account." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
