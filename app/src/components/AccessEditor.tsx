import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Access, AREAS_LIST, Level, LEVELS, PERMS_LIST } from '../data/access';
import { colors, fonts } from '../theme';
import { SwitchRow } from './SwitchRow';
import { Card, H2, Muted } from './ui';

/** Off / View / Edit for each area, then the extra permission switches. */
export function AccessEditor({ value, onChange, who }: { value: Access; onChange: (a: Access) => void; who: string }) {
  return (
    <>
      <Card style={{ gap: 0 }}>
        <H2>{`What ${who} can use`}</H2>
        <Muted style={{ paddingBottom: 4 }}>Off = hidden · View = look only · Edit = add and change</Muted>
        {AREAS_LIST.map((a, i) => (
          <View key={a.value} style={[st.row, i > 0 && st.border]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.title}>{a.label}</Text>
              <Muted>{a.sub}</Muted>
            </View>
            <View style={st.seg} accessibilityRole="radiogroup" accessibilityLabel={`${a.label} access`}>
              {LEVELS.map((l) => {
                const on = value.areas[a.value] === l.value;
                return (
                  <Pressable
                    key={l.value}
                    onPress={() => onChange({ ...value, areas: { ...value.areas, [a.value]: l.value as Level } })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${a.label}: ${l.label}`}
                    style={[st.segBtn, on && st.segOn]}
                  >
                    <Text style={[st.segText, on && { color: colors.white }]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 0 }}>
        <H2>Extra permissions</H2>
        {PERMS_LIST.map((p, i) => (
          <SwitchRow
            key={p.value}
            label={p.label}
            sub={p.sub}
            value={value.perms[p.value]}
            onChange={(on) => onChange({ ...value, perms: { ...value.perms, [p.value]: on } })}
            style={[st.row, i > 0 && st.border]}
          />
        ))}
      </Card>
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: colors.line },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  seg: { flexDirection: 'row', gap: 2, padding: 3, backgroundColor: '#E6E9F1', borderRadius: 12 },
  segBtn: { minWidth: 46, minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segOn: { backgroundColor: colors.navy },
  segText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
});
