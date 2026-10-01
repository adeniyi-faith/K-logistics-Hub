import { StyleSheet, View } from 'react-native';

import { Text } from './Text';

import { naira } from '../lib/format';
import { colors, fonts } from '../theme';

const SHADES = [colors.navy, colors.orange, '#7C8DB5', '#C9CFDB', '#3E5A8C', '#F4B860', '#9AA3B5'];

/** A bar split by category, with a key underneath. */
export function CategoryBar({ rows }: { rows: { category: string; amount: number }[] }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  if (!total) return <Text style={st.muted}>No expenses.</Text>;
  return (
    <View style={{ gap: 10 }}>
      <View style={st.bar}>
        {rows.map((r, i) => (
          <View key={r.category} style={{ flex: r.amount, backgroundColor: SHADES[i % SHADES.length] }} />
        ))}
      </View>
      <View style={st.key}>
        {rows.map((r, i) => (
          <View key={r.category} style={st.keyItem}>
            <View style={[st.dot, { backgroundColor: SHADES[i % SHADES.length] }]} />
            <Text style={st.keyText} numberOfLines={1}>
              {r.category}
            </Text>
            <Text style={st.keyAmount}>{naira(r.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', height: 14, borderRadius: 8, overflow: 'hidden', gap: 2 },
  // One category per line, so long names like "Transport" never break in the middle.
  key: { gap: 8 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 3 },
  keyText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.navy },
  keyAmount: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
