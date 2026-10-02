import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Text } from './Text';
import { Button, Card, H2, Muted } from './ui';

/** Sign out, plus (in demo mode) a button to put the sample data back the way it started. */
export function SignedInMenu() {
  const { mode, state, sync, signOut, resetDemo, setViewAs } = useStore();
  const [warn, setWarn] = useState(false);

  // Admin looking at the app as someone else: going back is the way out, not signing out.
  if (state.session?.viewing) {
    return (
      <Card>
        <H2>Viewing as {state.session.name}</H2>
        <Button
          title="Back to Admin"
          icon="back"
          onPress={() => {
            setViewAs(null);
            router.replace('/admin');
          }}
        />
      </Card>
    );
  }

  const out = () => {
    // Signing out clears this phone, so changes not uploaded yet would be lost.
    if (mode === 'live' && sync.waiting > 0 && !warn) return setWarn(true);
    signOut();
    router.replace('/');
  };

  return (
    <Card>
      <H2>This phone</H2>
      {mode === 'demo' ? <Muted>Demo mode: sample data saved only on this phone.</Muted> : null}
      {warn ? (
        <Text style={st.warn}>
          {sync.waiting === 1 ? '1 change' : `${sync.waiting} changes`} on this phone haven't reached the business yet (no
          internet). If you sign out now they will be lost. Connect to the internet and wait a moment, or tap Sign out again to
          sign out anyway.
        </Text>
      ) : null}
      <View style={{ gap: 10 }}>
        {mode === 'demo' ? <Button title="Reset sample data" kind="ghost" icon="refresh" onPress={resetDemo} /> : null}
        <Button title={warn ? 'Sign out anyway' : 'Sign out'} kind="danger" icon="logout" onPress={out} />
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  warn: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});

/** For areas of the design that are not built yet. */
export function ComingNext({ what }: { what: string }) {
  return (
    <Card>
      <H2>Coming next</H2>
      <Muted>{what}</Muted>
    </Card>
  );
}
