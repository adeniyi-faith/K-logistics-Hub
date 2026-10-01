import { View } from 'react-native';

import { ComingNext, SignedInMenu } from '../../components/SignedInMenu';
import { Screen, TopBar } from '../../components/ui';

export default function More() {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="More" />
      <Screen>
        <ComingNext what="Expenses, Staff & pay, Riders & bikes, Finance, Reports, Users & access and Business settings." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
