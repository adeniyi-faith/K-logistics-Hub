// Import each font weight on its own so the app only carries the five it uses.
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from '../components/Splash';
import { AppStoreProvider } from '../store/AppStore';
import { colors } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, Poppins_600SemiBold, Poppins_700Bold });
  const [intro, setIntro] = useState(true);
  const introDone = useCallback(() => setIntro(false), []);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <StatusBar style={intro ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            // New screens slide in from the right instead of popping up.
            animation: 'slide_from_right',
            animationDuration: 280,
          }}
        />
        {intro ? <Splash onDone={introDone} /> : null}
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
