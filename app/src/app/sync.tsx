import { View } from 'react-native';

import { Card, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { clock } from '../lib/format';
import { useStore } from '../store/AppStore';

export default function SyncCentre() {
  const { state, mode, sync } = useStore();
  const waiting = [...state.pending].reverse();
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Sync centre" back />
      <Screen>
        <Card>
          <H2>{waiting.length ? `${waiting.length} changes waiting to upload` : 'Everything is uploaded'}</H2>
          <Muted>
            {mode === 'demo'
              ? 'Demo mode: changes stay on this phone. Uploading works once Supabase and PowerSync are set up.'
              : sync.status === 'offline'
                ? 'No connection right now. Every change is saved on this phone and uploads by itself when you are back online.'
                : 'Every change is saved on this phone first, then uploaded.'}
          </Muted>
        </Card>
        {waiting.length ? (
          <Card style={{ paddingVertical: 8 }}>
            {waiting.map((c, i) => (
              <Row key={c.id} first={i === 0} title={c.label} sub={c.at ? `Saved at ${clock(c.at)}` : 'Saved on this phone'} />
            ))}
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}
