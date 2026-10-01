import { router } from 'expo-router';
import { View } from 'react-native';

import { useStore } from '../store/AppStore';
import { Button, Card, H2, Muted } from './ui';

/** Sign out, plus a button to put the sample data back the way it started. */
export function SignedInMenu() {
  const { signOut, resetDemo } = useStore();
  return (
    <Card>
      <H2>This phone</H2>
      <Muted>The app uses sample data until the online database is set up.</Muted>
      <View style={{ gap: 10 }}>
        <Button title="Reset sample data" kind="ghost" icon="refresh" onPress={resetDemo} />
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
