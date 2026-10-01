// The AI Assistant's own icons, and the small floating "Ask AI" button that opens it.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors, fonts } from '../theme';

const PATHS = {
  spark:
    '<path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
};

export function AiIcon({ name, size = 20, color = colors.navy }: { name: keyof typeof PATHS; size?: number; color?: string }) {
  const xml =
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

/** Sits above the bottom tabs on the Admin screens. */
export function AskAiButton({ bottom }: { bottom: number }) {
  return (
    <Pressable
      onPress={() => router.push('/assistant')}
      accessibilityRole="button"
      accessibilityLabel="Ask the AI Assistant"
      style={({ pressed }) => [st.fab, { bottom, opacity: pressed ? 0.85 : 1 }]}
    >
      <AiIcon name="spark" size={20} color={colors.orange} />
      <Text style={st.text}>Ask AI</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.navy,
    shadowColor: '#0F1E3B',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.white },
});
