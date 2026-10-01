import { View } from 'react-native';

import { ComingNext } from '../../components/SignedInMenu';
import { Screen, TopBar } from '../../components/ui';

export default function SalesTab() {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Sales" />
      <Screen>
        <ComingNext what="Orders list, New sale, Delivered orders and Delivery proof." />
      </Screen>
    </View>
  );
}
