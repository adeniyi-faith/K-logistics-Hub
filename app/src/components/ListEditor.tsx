import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { H2, LinkText } from './ui';

/**
 * A list of names shown as chips: tap × to remove one, "+ Add" to add one.
 * locked: names that can't be removed (shown with a lock).
 */
export function ListEditor({
  title,
  items,
  onChange,
  locked = [],
  placeholder,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  locked?: string[];
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  const add = () => {
    const t = text.trim();
    if (t && !items.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...items, t]);
    setText('');
    setAdding(false);
  };

  return (
    <View style={{ gap: 10 }}>
      <H2 right={adding ? undefined : <LinkText onPress={() => setAdding(true)}>+ Add</LinkText>}>{title}</H2>
      {adding ? (
        <View style={st.addRow}>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            placeholder={placeholder}
            placeholderTextColor="#8A93A6"
            accessibilityLabel={`New ${title.toLowerCase()}`}
            style={st.input}
          />
          <Pressable onPress={add} accessibilityRole="button" style={st.addBtn}>
            <Text style={st.addText}>Add</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={st.wrap}>
        {items.map((t) => {
          const keep = locked.includes(t);
          return (
            <View key={t} style={st.chip}>
              <Text style={st.chipText}>{t}</Text>
              {keep ? (
                <Icon name="lock" size={14} color={colors.muted} />
              ) : (
                <Pressable
                  onPress={() => onChange(items.filter((x) => x !== t))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${t}`}
                  hitSlop={10}
                >
                  <Icon name="x" size={14} color={colors.muted} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.inputLine,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  addBtn: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.navy, justifyContent: 'center' },
  addText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
});
