import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useStore } from '../store/AppStore';
import { colors } from '../theme';
import { Muted } from './ui';

/** Shows a delivery photo, whether it's still on this phone or already uploaded. */
export function ProofPhoto({ photo }: { photo: string }) {
  const { photoUrl } = useStore();
  const [uri, setUri] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    photoUrl(photo)
      .then((u) => live && setUri(u))
      .catch(() => live && setUri(null));
    return () => {
      live = false;
    };
  }, [photo, photoUrl]);

  if (uri === undefined) return <View style={st.box} />;
  if (uri === null) {
    return (
      <View style={[st.box, st.center]}>
        <Muted>Photo can't be loaded right now. It shows once this phone is online.</Muted>
      </View>
    );
  }
  return <Image source={{ uri }} style={st.box} resizeMode="cover" accessibilityLabel="Delivery photo" />;
}

const st = StyleSheet.create({
  box: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.grayBg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 16 },
});
