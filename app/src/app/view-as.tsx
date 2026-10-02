import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '../components/Icon';
import { RiderAvatar } from '../components/RiderAvatar';
import { Avatar, Card, H2, Muted, Row, Screen, TopBar } from '../components/ui';
import { useWords } from '../lib/words';
import { useStore, ViewAs } from '../store/AppStore';
import { colors } from '../theme';

/** Admin: open the app the way one staff member or rider sees it. */
export default function ViewAsScreen() {
  const { state, setViewAs } = useStore();
  const w = useWords();

  // Just picked someone: the app is on its way to their screens.
  if (state.session?.viewing) return null;
  if (state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="See the app as…" back />
        <Screen>
          <Muted>Only Admin can do this.</Muted>
        </Screen>
      </View>
    );
  }

  // Back on the Admin screens, which now send the app to this person's home (see admin/_layout).
  const open = (v: ViewAs) => {
    setViewAs(v);
    router.dismissAll();
  };
  const roleName = (id?: string) => state.roles.find((r) => r.id === id)?.name ?? 'No role yet';
  const staff = state.staff.filter((x) => x.active);
  const chev = <Icon name="chev" color={colors.muted} />;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="See the app as…" back />
      <Screen>
        <Muted>
          Pick someone to see exactly what they see. A bar at the top takes you back to Admin. Anything you change while looking
          is saved under your name.
        </Muted>
        <Card style={{ paddingVertical: 4 }}>
          <H2>Staff</H2>
          {staff.length ? (
            staff.map((x) => (
              <Row
                key={x.id}
                lead={<Avatar initials={x.initials} />}
                title={x.name}
                sub={`${x.job} · ${roleName(x.roleId)}`}
                rightSub={chev}
                onPress={() => open({ role: 'staff', id: x.id })}
              />
            ))
          ) : (
            <Muted style={{ paddingBottom: 12 }}>No staff yet. Add them in Staff & pay.</Muted>
          )}
        </Card>
        <Card style={{ paddingVertical: 4 }}>
          <H2>{w.Riders}</H2>
          {state.riders.length ? (
            state.riders.map((r) => (
              <Row
                key={r.id}
                lead={<RiderAvatar rider={r} />}
                title={r.name}
                sub={r.bike}
                rightSub={chev}
                onPress={() => open({ role: 'rider', id: r.id })}
              />
            ))
          ) : (
            <Muted style={{ paddingBottom: 12 }}>No {w.riders} yet.</Muted>
          )}
        </Card>
      </Screen>
    </View>
  );
}
