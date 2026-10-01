import { Pressable, StyleSheet, Text, View } from 'react-native';

import { movePeriod, Period, periodLabel, periodOf, PeriodKind } from '../lib/money';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Chips } from './ui';

/** Day / Week / Month, with arrows to step back and forward. Stops at the shop's open day. */
export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { state } = useStore();
  const canGoOn = value.to < state.day;
  return (
    <View style={{ gap: 10 }}>
      <Chips<PeriodKind>
        full
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        value={value.kind}
        onChange={(k) => onChange(periodOf(k, state.day))}
      />
      <View style={st.bar}>
        <Pressable onPress={() => onChange(movePeriod(value, -1))} accessibilityLabel="Earlier" style={st.arrow}>
          <Icon name="back" size={18} />
        </Pressable>
        <Text style={st.label}>{periodLabel(value)}</Text>
        <Pressable
          onPress={() => onChange(movePeriod(value, 1))}
          disabled={!canGoOn}
          accessibilityLabel="Later"
          style={[st.arrow, !canGoOn && { opacity: 0.3 }]}
        >
          <Icon name="chev" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
});
