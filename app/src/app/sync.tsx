import { View } from 'react-native';

import { Card, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { clock } from '../lib/format';
import { useStore } from '../store/AppStore';

export default function SyncCentre() {
  const { state } = useStore();
  const waiting = [...state.pending].reverse();
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Sync centre" back />
      <Screen>
        <Card>
          <H2>{waiting.length ? `${waiting.length} changes waiting to upload` : 'Everything is uploaded'}</H2>
          <Muted>
            Every change is saved on this phone first. Uploading starts once the online database is connected (a later step).
          </Muted>
        </Card>
        {waiting.length ? (
          <Card style={{ paddingVertical: 8 }}>
            {waiting.map((c, i) => (
              <Row key={c.id} first={i === 0} title={c.label} sub={`Saved at ${clock(c.at)}`} />
            ))}
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}
