import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { confirm } from '../lib/confirm';
import { colors, fonts } from '../theme';
import { Text } from './Text';
import { Button } from './ui';

/**
 * Admin: a red button that asks "are you sure?", runs `remove`, then leaves the screen.
 * `remove` may return an error message to show instead of leaving.
 */
export function DeleteButton({
  title,
  question,
  message,
  yes = 'Delete',
  remove,
}: {
  title: string;
  question: string;
  message: string;
  yes?: string;
  remove: () => unknown;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    if (!(await confirm(question, message, yes))) return;
    setBusy(true);
    setError('');
    const r = await remove();
    setBusy(false);
    if (typeof r === 'string' && r) return setError(r);
    if (router.canGoBack()) router.back();
  };
  return (
    <View style={{ gap: 8 }}>
      {error ? <Text style={st.error}>{error}</Text> : null}
      <Button title={busy ? 'Removing…' : title} kind="danger" icon="trash" onPress={go} disabled={busy} />
    </View>
  );
}

const st = StyleSheet.create({
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
