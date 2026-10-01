import { View } from 'react-native';

import { colors } from '../theme';
import { Icon } from './Icon';
import { IconName } from './icons';

/** Tab icon with the small orange line above the active tab, as in the design. */
export function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const color = focused ? colors.navy : colors.tabIdle;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: focused ? colors.orange : 'transparent' }} />
      <Icon name={name} size={22} color={color} strokeWidth={focused ? 2 : 1.8} />
    </View>
  );
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.navy,
  tabBarInactiveTintColor: colors.tabIdle,
  tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 72, paddingTop: 4 },
  tabBarLabelStyle: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
};
