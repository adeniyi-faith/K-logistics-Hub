import { Redirect } from 'expo-router';
import Tabs from 'expo-router/tabs';

import { TabBarIcon, tabScreenOptions } from '../../components/TabBarIcon';
import { useAccess } from '../../lib/useAccess';
import { useStore } from '../../store/AppStore';

/** The staff app: only the areas this person may use, plus Me. */
export default function StaffTabs() {
  const { state } = useStore();
  const { canView } = useAccess();
  if (state.session?.role !== 'staff') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          href: canView('stock') ? undefined : null,
          tabBarIcon: ({ focused }) => <TabBarIcon name="box" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          href: canView('sales') ? undefined : null,
          tabBarIcon: ({ focused }) => <TabBarIcon name="cart" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          href: canView('customers') ? undefined : null,
          tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: 'Me', tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} /> }}
      />
    </Tabs>
  );
}
