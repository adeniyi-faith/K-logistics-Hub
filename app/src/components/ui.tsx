// Shared building blocks that match design/generator/lib.py.
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import { Text, TextInput } from './Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { IconName } from './icons';

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const scroll = useRef<ScrollView>(null);
  const offset = useRef(0);
  const footerHeight = useRef(0);
  // When the keyboard opens, move the box being typed in up so the keyboard doesn't cover it.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      setTimeout(() => {
        const input = RNTextInput.State.currentlyFocusedInput();
        if (!input || !scroll.current) return;
        input.measureInWindow((_x, y, _w, h) => {
          const visibleBottom = e.endCoordinates.screenY - footerHeight.current - 16;
          if (y + h > visibleBottom) scroll.current?.scrollTo({ y: offset.current + (y + h - visibleBottom), animated: true });
        });
      }, 120);
    });
    return () => sub.remove();
  }, []);
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={32}
        onScroll={(e) => (offset.current = e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={s.footer} onLayout={(e) => (footerHeight.current = e.nativeEvent.layout.height)}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/**
 * Shows only when the phone has no internet: a small grey cloud. Work is saved on the phone either way,
 * so there is nothing to show when all is well. Tapping it opens the Sync centre.
 */
export function SyncPill() {
  const { sync } = useStore();
  if (sync.status !== 'offline') return null;
  return (
    <Pressable
      onPress={() => router.push('/sync')}
      accessibilityRole="button"
      accessibilityLabel="No internet. Your work is saved and will go up when you're back online."
      hitSlop={10}
      style={s.pill}
    >
      <Icon name="cloudoff" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function TopBar({ title, sub, back, right }: { title: string; sub?: string; back?: boolean; right?: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.white }}>
      <View style={s.topbar}>
        {back ? (
          <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={s.back}>
            <Icon name="back" size={24} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {sub ? (
            <Text style={s.topSub} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
          <Text style={s.topTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right}
        <SyncPill />
      </View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H2({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.h2Row}>
      <Text style={s.h2}>{children}</Text>
      {right}
    </View>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.link}>{children}</Text>
    </Pressable>
  );
}

const BADGE = {
  green: [colors.greenBg, colors.green],
  amber: [colors.orangeBg, colors.orangeText],
  red: [colors.redBg, colors.red],
  blue: [colors.blueBg, colors.blue],
  gray: [colors.grayBg, colors.muted],
} as const;

export function Badge({ children, kind = 'gray' }: { children: ReactNode; kind?: keyof typeof BADGE }) {
  const [bg, fg] = BADGE[kind];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{children}</Text>
    </View>
  );
}

type ButtonKind = 'primary' | 'accent' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
}) {
  const look = {
    primary: { bg: colors.navy, fg: colors.white, line: colors.navy },
    accent: { bg: colors.orange, fg: colors.white, line: colors.orange },
    ghost: { bg: colors.white, fg: colors.navy, line: colors.inputLine },
    danger: { bg: colors.white, fg: colors.red, line: '#F1C4BF' },
  }[kind];
  // On small phones two buttons side by side are tight, so the text is a little smaller to stay on one line.
  const small = useWindowDimensions().width < 400;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: look.bg, borderColor: look.line, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 18 : 20} color={look.fg} /> : null}
      <Text
        style={[s.btnText, { color: look.fg }, small && { fontSize: 15 }, { flexShrink: 1 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function statSize(value: string) {
  return value.length <= 6 ? 20 : value.length <= 7 ? 18 : value.length <= 8 ? 15 : 13;
}

export function Stat({ label, value, note, noteColor }: { label: string; value: string; note?: string; noteColor?: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      {/* Long amounts (e.g. ₦1,010,500) get smaller text so they stay on one line on small phones. */}
      <Text style={[s.statValue, { fontSize: statSize(value) }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {note ? <Text style={[s.statNote, { color: noteColor ?? colors.muted }]}>{note}</Text> : null}
    </View>
  );
}

export function Row({
  lead,
  title,
  sub,
  right,
  rightSub,
  onPress,
  first,
}: {
  lead?: ReactNode;
  title: string;
  sub?: string;
  right?: string;
  rightSub?: ReactNode;
  onPress?: () => void;
  first?: boolean;
}) {
  const body = (
    <>
      {lead}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {right ? <Text style={s.rowTitle}>{right}</Text> : null}
        {rightSub}
      </View>
    </>
  );
  const style = [s.row, !first && s.rowBorder];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [...style, pressed && { opacity: 0.7 }]}>
      {body}
    </Pressable>
  ) : (
    <View style={style}>{body}</View>
  );
}

export function IconTile({ name, bg = colors.orangeBg, fg = colors.orangeText }: { name: IconName; bg?: string; fg?: string }) {
  return (
    <View style={[s.tile, { backgroundColor: bg }]}>
      <Icon name={name} size={20} color={fg} />
    </View>
  );
}

export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size }]}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size * 0.36, color: colors.navy }}>{initials}</Text>
    </View>
  );
}

export function Field({ label, helper, ...input }: TextInputProps & { label: string; helper?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor="#8A93A6" style={s.input} accessibilityLabel={label} {...input} />
      {helper ? <Text style={s.helper}>{helper}</Text> : null}
    </View>
  );
}

/** Chips: a row of choices where one is picked. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  full,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.chip, full && { flexGrow: 1 }, on ? s.chipOn : s.chipOff]}
          >
            <Text style={[s.chipText, { color: on ? colors.white : colors.navy }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

export const s = StyleSheet.create({
  footer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
  topSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grayBg,
  },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, gap: 12 },
  h2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  h2: { fontFamily: fonts.head, fontSize: 16, color: colors.navy },
  link: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.orangeText },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  btn: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    minWidth: 0,
  },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  statValue: { fontFamily: fonts.head, fontSize: 20, color: colors.navy },
  statNote: { fontFamily: fonts.bodyBold, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  rowSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatar: { borderRadius: 999, backgroundColor: '#E4E9F5', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inputLine,
    borderRadius: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.navy,
  },
  helper: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipOff: { backgroundColor: colors.white, borderColor: colors.line },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
