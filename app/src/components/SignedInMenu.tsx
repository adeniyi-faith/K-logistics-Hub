import { router } from 'expo-router';
import { View } from 'react-native';

import { useStore } from '../store/AppStore';
import { Button, Card, H2, Muted } from './ui';

/** Sign out, plus (in demo mode) a button to put the sample data back the way it started. */
export function SignedInMenu() {
  const { mode, signOut, resetDemo } = useStore();
  return (
    <Card>
      <H2>This phone</H2>
      {mode === 'demo' ? <Muted>Demo mode: sample data saved only on this phone.</Muted> : null}
      <View style={{ gap: 10 }}>
        {mode === 'demo' ? <Button title="Reset sample data" kind="ghost" icon="refresh" onPress={resetDemo} /> : null}
        <Button
          title="Sign out"
          kind="danger"
          icon="logout"
          onPress={() => {
            signOut();
            router.replace('/');
          }}
        />
      </View>
    </Card>
  );
}

/** For areas of the design that are not built yet. */
export function ComingNext({ what }: { what: string }) {
  return (
    <Card>
      <H2>Coming next</H2>
      <Muted>{what}</Muted>
    </Card>
  );
}
