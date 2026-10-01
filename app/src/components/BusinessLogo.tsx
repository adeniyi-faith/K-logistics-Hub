import { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

import { useStore } from '../store/AppStore';

const BUILT_IN = require('../../assets/logo.jpg');

/** The logo from Business settings, or the built-in one until a new logo has been chosen (or while it can't load). */
export function BusinessLogo({ style }: { style: StyleProp<ImageStyle> }) {
  const { state, photoUrl } = useStore();
  const logo = state.settings.logo;
  // Remember which logo the loaded address belongs to, so a changed logo never shows the old one.
  const [loaded, setLoaded] = useState<{ logo: string; uri: string | null } | null>(null);
  const uri = logo && loaded?.logo === logo ? loaded.uri : null;

  useEffect(() => {
    let live = true;
    if (logo) {
      photoUrl(logo)
        .then((u) => live && setLoaded({ logo, uri: u }))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [logo, photoUrl]);

  return (
    <Image
      source={uri ? { uri } : BUILT_IN}
      style={style}
      resizeMode="contain"
      accessibilityLabel={`${state.settings.businessName} logo`}
    />
  );
}
