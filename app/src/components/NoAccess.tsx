import { View } from 'react-native';

import { Muted, Screen, TopBar } from './ui';

/** Shown instead of a screen the signed-in person isn't allowed to use. */
export function NoAccess({ title, why = "You don't have access to this. Ask Admin if you need it." }: { title: string; why?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={title} back />
      <Screen>
        <Muted>{why}</Muted>
      </Screen>
    </View>
  );
}
