import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { ComingNext, SignedInMenu } from '../components/SignedInMenu';
import { Screen, TopBar } from '../components/ui';
import { useStore } from '../store/AppStore';

export default function StaffHome() {
  const { state } = useStore();
  if (state.session?.role !== 'staff') return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`Hi, ${state.session.name}`} />
      <Screen>
        <ComingNext what="The staff app, where each person only sees the areas Admin has given them." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
