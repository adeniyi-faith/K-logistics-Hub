import { Redirect } from 'expo-router';
import Tabs from 'expo-router/tabs';

import { TabBarIcon, tabScreenOptions } from '../../components/TabBarIcon';
import { useStore } from '../../store/AppStore';

export default function AdminTabs() {
  const { state } = useStore();
  if (state.session?.role !== 'admin') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stock"
        options={{ title: 'Stock', tabBarIcon: ({ focused }) => <TabBarIcon name="box" focused={focused} /> }}
      />
      <Tabs.Screen
        name="sales"
        options={{ title: 'Sales', tabBarIcon: ({ focused }) => <TabBarIcon name="cart" focused={focused} /> }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} /> }}
      />
    </Tabs>
  );
}
