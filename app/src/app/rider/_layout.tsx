import { Redirect } from 'expo-router';
import Tabs from 'expo-router/tabs';

import { TabBarIcon, tabScreenOptions } from '../../components/TabBarIcon';
import { useStore } from '../../store/AppStore';

export default function RiderTabs() {
  const { state } = useStore();
  if (state.session?.role !== 'rider') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Deliveries', tabBarIcon: ({ focused }) => <TabBarIcon name="truck" focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ focused }) => <TabBarIcon name="clock" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} /> }} />
    </Tabs>
  );
}
