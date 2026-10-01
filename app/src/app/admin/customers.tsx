import { View } from 'react-native';

import { ComingNext } from '../../components/SignedInMenu';
import { Screen, TopBar } from '../../components/ui';

export default function CustomersTab() {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Customers" />
      <Screen>
        <ComingNext what="Customer list and customer profiles with delivery history." />
      </Screen>
    </View>
  );
}
