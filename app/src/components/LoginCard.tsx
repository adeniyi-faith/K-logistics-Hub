import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getLogin, LoginKind, setLogin } from '../live/logins';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button, Card, Field, H2, Muted } from './ui';

/** Admin: the email and password a staff member or rider signs in with. */
export function LoginCard({ kind, id, name }: { kind: LoginKind; id: string; name: string }) {
  const { mode } = useStore();
  const first = name.split(' ')[0];
  const [current, setCurrent] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<{ text: string; ok?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    getLogin(kind, id).then((r) => {
      if (!live) return;
      if (r.error) setNote({ text: r.error });
      setCurrent(r.email ?? null);
      setEmail(r.email ?? '');
    });
    return () => {
      live = false;
    };
  }, [kind, id]);

  const save = async () => {
    setNote(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setNote({ text: 'Enter a proper email address.' });
    if (!current && !password) return setNote({ text: `Enter a password for ${first}'s first sign-in.` });
    if (password && password.length < 8) return setNote({ text: 'The password needs at least 8 characters.' });
    setBusy(true);
    const r = await setLogin(kind, id, email.trim(), password);
    setBusy(false);
    if (r.error) return setNote({ text: r.error });
    setCurrent(r.email ?? email.trim());
    setPassword('');
    setNote({
      ok: true,
      text: `Saved. ${first} can now sign in with ${r.email ?? email.trim()}${password ? ' and the new password' : ''}. Share them privately.`,
    });
  };

  return (
    <Card>
      <H2>Sign-in details</H2>
      <Muted>
        {current === undefined
          ? 'Checking…'
          : current
            ? `${first} signs in with ${current}. Change the email, or type a new password to reset it.`
            : `${first} has no sign-in yet. Choose an email and password for them.`}
      </Muted>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <View style={{ gap: 6 }}>
        <Field
          label={current ? 'New password (leave empty to keep it)' : 'Password'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          helper="At least 8 characters."
        />
        <Pressable onPress={() => setShow(!show)} accessibilityRole="button" hitSlop={8} style={st.show}>
          <Icon name="eye" size={18} color={colors.muted} />
          <Text style={st.showText}>{show ? 'Hide password' : 'Show password'}</Text>
        </Pressable>
      </View>
      {note ? <Text style={[st.note, note.ok && { color: colors.green }]}>{note.text}</Text> : null}
      <Button title={busy ? 'Saving…' : 'Save sign-in details'} onPress={save} disabled={busy || current === undefined} />
      {mode === 'demo' ? <Muted>Demo mode: no real account is made.</Muted> : null}
    </Card>
  );
}

const st = StyleSheet.create({
  show: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  showText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  note: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
