import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Icon } from '../components/Icon';
import { Badge, Button, Card, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { describeClash } from '../lib/clashes';
import { clock, dayLabel } from '../lib/format';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Sync centre: what is waiting to upload, and (for Admin) clashes to decide. */
export default function SyncCentre() {
  const { state, mode, sync, resolveClash, dismissRefused } = useStore();
  const refused = state.refused ?? [];
  const waiting = [...state.pending].reverse();
  const isAdmin = state.session?.role === 'admin';
  const clashes = isAdmin ? state.clashes : [];
  const offline = sync.status === 'offline';

  const head =
    mode === 'demo'
      ? { title: 'Demo mode', text: 'Changes stay on this phone. The real app uploads them for everyone.' }
      : offline
        ? { title: "You're offline", text: 'Keep working. Everything uploads by itself when the internet is back.' }
        : sync.status === 'syncing'
          ? { title: 'Syncing', text: 'Uploading and downloading changes now.' }
          : { title: 'All synced', text: 'Every change on this phone is uploaded.' };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Sync centre" back />
      <Screen>
        <View style={st.hero}>
          <View style={st.heroTop}>
            <View style={st.heroIcon}>
              <Icon name={offline || mode === 'demo' ? 'cloudoff' : 'cloudok'} size={24} color="#FFD7A8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.heroTitle}>{head.title}</Text>
              <Text style={st.heroSub}>
                {waiting.length
                  ? `${waiting.length} ${waiting.length === 1 ? 'change is' : 'changes are'} saved safely on this phone`
                  : 'Nothing waiting to upload'}
              </Text>
            </View>
          </View>
          <Text style={st.heroSub}>{head.text}</Text>
        </View>

        {clashes.length ? (
          <Card>
            <H2 right={<Badge kind="red">{String(clashes.length)}</Badge>}>Needs your decision</H2>
            <Muted>
              The same thing was changed on two phones while one was offline. The first change to arrive is in use now. Pick the
              one to keep.
            </Muted>
            {clashes.map((c) => {
              const v = describeClash(state, c);
              const by = c.mineBy || 'another phone';
              return (
                <View key={c.id} style={st.clash}>
                  <Text style={st.clashTitle}>{v.title}</Text>
                  <Muted>
                    Changed on {by}'s phone {c.at ? `on ${dayLabel(c.at.slice(0, 10))} at ${clock(c.at)}` : ''}
                  </Muted>
                  <View style={st.pair}>
                    <View style={st.box}>
                      <Text style={st.boxLabel}>In use now</Text>
                      <Text style={st.boxValue}>{v.theirs || 'Saved first'}</Text>
                    </View>
                    <View style={st.box}>
                      <Text style={st.boxLabel}>From {by}</Text>
                      <Text style={st.boxValue}>{v.mine || 'Saved later'}</Text>
                    </View>
                  </View>
                  <View style={st.pair}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title={v.theirs ? `Keep ${v.theirs}` : 'Keep this one'}
                        kind="ghost"
                        onPress={() => resolveClash(c.id, 'theirs')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title={v.mine ? `Keep ${v.mine}` : `Keep ${by}'s`}
                        kind="ghost"
                        onPress={() => resolveClash(c.id, 'mine')}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        ) : null}

        {refused.length ? (
          <Card style={{ paddingVertical: 8 }}>
            <H2 right={<Badge kind="red">{String(refused.length)}</Badge>}>Not accepted</H2>
            <Muted>
              The business didn't accept these changes from this phone, usually because this person isn't allowed to make them.
              They were undone here, so this phone matches everyone else again. Ask Admin if one was needed.
            </Muted>
            {refused.map((c, i) => (
              <Row
                key={c.id}
                first={i === 0}
                title={c.label}
                sub={`${c.at ? `${dayLabel(c.at.slice(0, 10))} at ${clock(c.at)} · ` : ''}${c.reason}`}
              />
            ))}
            <Button title="Clear this list" kind="ghost" onPress={dismissRefused} />
          </Card>
        ) : null}

        <Card style={{ paddingVertical: 8 }}>
          <H2 right={waiting.length ? <Badge kind="amber">{String(waiting.length)}</Badge> : undefined}>Waiting to upload</H2>
          {waiting.length === 0 ? <Muted style={{ paddingVertical: 8 }}>Everything is uploaded.</Muted> : null}
          {waiting.map((c, i) => (
            <Row key={c.id} first={i === 0} title={c.label} sub={c.at ? `Saved at ${clock(c.at)}` : 'Saved on this phone'} />
          ))}
        </Card>

        <Muted>
          Orders, payments and expenses are always added as new records, so they never clash. Stock is worked out from what came
          in and went out, so it doesn't clash either.
        </Muted>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: 20, padding: 20, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#24365F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: fonts.head, fontSize: 20, color: colors.white },
  heroSub: { fontFamily: fonts.body, fontSize: 14, color: '#B8C3DB' },
  clash: { gap: 8, paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.line },
  clashTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  pair: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.bg, gap: 2 },
  boxLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  boxValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
});
