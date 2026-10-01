import { Switch, StyleSheet, Text, View } from 'react-native';

import { Card, H2, Muted, Screen, TopBar } from '../components/ui';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

/** Business settings (Admin). More settings from the design come later. */
export default function Settings() {
  const { state, updateSettings } = useStore();
  const s = state.settings;

  if (state.session?.role !== 'admin') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Business settings" back />
        <Screen>
          <Muted>Only Admin can change business settings.</Muted>
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Business settings" back />
      <Screen>
        <Card>
          <H2>Proof of delivery</H2>
          <View style={st.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.label}>Ask riders for a delivery photo</Text>
              <Muted>
                {s.requirePhoto
                  ? 'On: riders must take a photo before they can confirm a delivery.'
                  : 'Off: riders confirm deliveries without a photo.'}
              </Muted>
            </View>
            <Switch
              value={s.requirePhoto}
              onValueChange={(v) => updateSettings({ ...s, requirePhoto: v })}
              trackColor={{ true: colors.navy, false: colors.inputLine }}
              thumbColor={colors.white}
              accessibilityLabel="Ask riders for a delivery photo"
            />
          </View>
          <Muted>Riders' phones pick up the change the next time they sync.</Muted>
        </Card>
      </Screen>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
});
