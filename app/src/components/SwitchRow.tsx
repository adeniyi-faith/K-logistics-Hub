import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from './Text';

import { colors, fonts } from '../theme';
import { Muted } from './ui';

/** A yes/no setting. The whole row can be tapped, not just the small switch. */
export function SwitchRow({
  label,
  sub,
  value,
  onChange,
  onColor = colors.green,
  style,
}: {
  label: string;
  sub?: ReactNode;
  value: boolean;
  onChange: (v: boolean) => void;
  onColor?: string;
  style?: object;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={[st.row, style]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={st.label}>{label}</Text>
        {sub ? typeof sub === 'string' ? <Muted>{sub}</Muted> : sub : null}
      </View>
      {/* The row handles the tap, so the switch itself only shows the state. */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value={value} trackColor={{ true: onColor, false: colors.inputLine }} thumbColor={colors.white} />
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
});
