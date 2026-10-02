import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { Icon } from '../components/Icon';
import { Button, Card, H2, Muted, Screen, TopBar } from '../components/ui';
import { confirm } from '../lib/confirm';
import { closingStock, nextDay, shiftDay } from '../lib/stock';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { useAccess } from '../lib/useAccess';

const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = (day: string) => `${Number(day.slice(8))} ${MO[Number(day.slice(5, 7)) - 1]}`;

/** Check the day, then copy each product's closing stock into tomorrow as opening stock. */
export default function CloseDay() {
  const { state, sync, closeDay, reopenDay } = useStore();
  const acc = useAccess();
  const next = nextDay(state.day);
  const prev = shiftDay(state.day, -1);
  const closing = closingStock(state);
  const pending = state.orders.filter((o) => o.status === 'pending').length;
  const noRider = state.orders.filter((o) => o.day === state.day && !o.riderId).length;

  if (!acc.can('closeDay')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Close the day" back />
        <Screen>
          <Muted>Only Admin can close the day.</Muted>
        </Screen>
      </View>
    );
  }

  const checks: { ok: boolean; title: string; sub: string }[] = [
    {
      ok: pending === 0,
      title: pending ? `${pending} deliveries still pending` : 'No deliveries pending',
      sub: pending ? `They carry over to ${short(next)} automatically` : 'Nothing to carry over',
    },
    {
      ok: sync.waiting === 0,
      title: sync.waiting ? `${sync.waiting} records not uploaded yet` : 'Everything uploaded',
      sub: sync.waiting ? "Fine — they'll sync later" : 'All saved online',
    },
    {
      ok: noRider === 0,
      title: noRider ? `${noRider} orders have no rider` : 'All orders have a rider',
      sub: noRider ? 'Give them a rider before tomorrow' : 'Nothing missing',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <TopBar title={`Close ${short(state.day)}`} back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            <Button
              title={`Close ${short(state.day)} and start ${short(next)}`}
              kind="accent"
              onPress={() => {
                closeDay();
                router.replace('/admin');
              }}
            />
            <Muted style={{ textAlign: 'center' }}>Admin can reopen it later if something needs fixing.</Muted>
          </View>
        }
      >
        <View style={st.note}>
          <Text style={st.noteText}>
            Closing moves the business to the next day. Tonight's closing stock becomes tomorrow's opening stock.
          </Text>
        </View>

        <Card>
          <H2>Check before closing</H2>
          {checks.map((c) => (
            <View key={c.title} style={st.check}>
              <Icon name={c.ok ? 'check' : 'alert'} color={c.ok ? colors.green : colors.orangeText} />
              <View style={{ flex: 1 }}>
                <Text style={st.checkTitle}>{c.title}</Text>
                <Muted>{c.sub}</Muted>
              </View>
            </View>
          ))}
        </Card>

        <Card>
          <H2>Carry over to tomorrow</H2>
          <View style={st.tr}>
            <Text style={[st.th, { flex: 1, textAlign: 'left' }]}>Product</Text>
            <Text style={st.th}>Close today</Text>
            <Text style={st.th}>Open {short(next)}</Text>
          </View>
          {state.products.map((p) => (
            <View key={p.id} style={st.tr}>
              <Text style={[st.td, { flex: 1, textAlign: 'left' }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={st.td}>{closing[p.id]}</Text>
              <Text style={[st.td, { fontFamily: fonts.bodyBold }]}>{closing[p.id]}</Text>
            </View>
          ))}
        </Card>

        {acc.isAdmin ? (
          <Card>
            <H2>Need to fix {short(prev)}?</H2>
            <Muted>
              Reopening goes back to {short(prev)} so you can add or fix its sales, stock and expenses. Close it again when you're
              done. Anything added meanwhile counts for {short(prev)}.
            </Muted>
            <Button
              title={`Reopen ${short(prev)}`}
              kind="ghost"
              icon="back"
              onPress={async () => {
                const ok = await confirm(
                  `Reopen ${short(prev)}?`,
                  `Every phone goes back to ${short(prev)} until someone closes it again.`,
                  'Reopen',
                );
                if (!ok) return;
                reopenDay();
                router.replace('/admin');
              }}
            />
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  note: { backgroundColor: colors.blueBg, borderRadius: 12, padding: 12 },
  noteText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.blue },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 },
  th: { width: 76, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  td: { width: 76, textAlign: 'right', fontFamily: fonts.body, fontSize: 14, color: colors.navy },
});
