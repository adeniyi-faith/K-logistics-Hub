import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { dayLabel, today } from '../lib/format';
import { useAccess } from '../lib/useAccess';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { LinkText } from './ui';

/** Shown when nobody closed the day: new sales would otherwise be dated to an old day. */
export function DayBehind() {
  const { state } = useStore();
  const { can } = useAccess();
  const now = today();
  if (state.day >= now) return null;
  return (
    <View style={st.box}>
      <Icon name="alert" size={20} color={colors.orangeText} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={st.text}>
          The business day is still {dayLabel(state.day)}, but today is {dayLabel(now)}. New orders and expenses are dated{' '}
          {dayLabel(state.day)} until the day is closed.
        </Text>
        {can('closeDay') ? <LinkText onPress={() => router.push('/close-day')}>Close the day</LinkText> : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, backgroundColor: colors.orangeBg, borderRadius: 12, padding: 12 },
  text: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.navy, lineHeight: 18 },
});
