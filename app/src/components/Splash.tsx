import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet } from 'react-native';

import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const NATIVE = Platform.OS !== 'web';

// Keep the phone's own start screen up until this one is ready to take over, so there's no flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** The opening screen: the logo grows in, the name and slogan fade up, then it all fades away. */
export function Splash({ onDone }: { onDone: () => void }) {
  const { state } = useStore();
  const logo = useRef(new Animated.Value(0)).current;
  const words = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.4)), useNativeDriver: NATIVE }),
      Animated.timing(words, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
      Animated.delay(700),
      Animated.timing(out, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
    ]).start(() => onDone());
  }, [logo, words, out, onDone]);

  return (
    <Animated.View style={[st.wrap, { opacity: out }]} pointerEvents="none">
      <Animated.View style={[st.glow, { opacity: logo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }]} />
      <Animated.View
        style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }}
      >
        <Image source={require('../../assets/splash-icon.png')} style={st.logo} accessibilityLabel="K-logistics Hub" />
      </Animated.View>
      <Animated.View
        style={{
          alignItems: 'center',
          gap: 6,
          opacity: words,
          transform: [{ translateY: words.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        <Animated.Text style={st.name} maxFontSizeMultiplier={1.15}>
          {state.settings.businessName}
        </Animated.Text>
        {state.settings.tagline ? (
          <Animated.Text style={st.tagline} maxFontSizeMultiplier={1.15}>
            {state.settings.tagline}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    zIndex: 10,
  },
  glow: { position: 'absolute', width: 340, height: 340, borderRadius: 999, backgroundColor: colors.navy2 },
  logo: { width: 180, height: 180 },
  name: { fontFamily: fonts.head, fontSize: 24, color: colors.white, textAlign: 'center' },
  tagline: { fontFamily: fonts.body, fontSize: 15, color: '#C9D3E6', textAlign: 'center' },
});
