import { Redirect, usePathname } from 'expo-router';
import Tabs from 'expo-router/tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskAiButton } from '../../components/AskAiButton';

import { TabBarIcon, tabScreenOptions } from '../../components/TabBarIcon';
import { useStore } from '../../store/AppStore';
import { useWords } from '../../lib/words';

export default function AdminTabs() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const w = useWords();
  const path = usePathname();
  // Stock and Sales have a big button above the tabs (Receive stock, New sale); sit above it.
  const footer = path.startsWith('/admin/stock') || path.startsWith('/admin/sales') ? 84 : 0;
  if (state.session?.role !== 'admin') return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
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
          options={{ title: w.Sales, tabBarIcon: ({ focused }) => <TabBarIcon name="cart" focused={focused} /> }}
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
      {/* Opens the AI Assistant from every Admin tab. 72 is the tab bar's height. */}
      <AskAiButton bottom={72 + insets.bottom + footer + 16} />
    </View>
  );
}
