import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LoginKind, setLogin } from '../live/logins';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { SwitchRow } from './SwitchRow';
import { Text } from './Text';
import { Card, Field, H2, Muted } from './ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The email and password for someone being added (Add staff, Add a rider), so their sign-in
 * is made in the same step. Use `card` on the page, `check()` before saving and `create()` after.
 */
export function useNewLogin(kind: LoginKind, who: string) {
  const { mode, uploadNow } = useStore();
  const [on, setOn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  /** An error message, or '' when the boxes are fine (or sign-in is switched off). */
  const check = () => {
    if (!on) return '';
    if (!EMAIL.test(email.trim())) return 'Enter a proper email address for their sign-in.';
    if (password.length < 8) return 'Their password needs at least 8 characters.';
    return '';
  };

  /** Makes the sign-in for the record just saved. Returns an error message, or '' when done. */
  const create = async (id: string) => {
    if (!on) return '';
    // The new record must reach the business online before a sign-in can point at it.
    try {
      if (!(await uploadNow(id))) return 'No internet, so the sign-in was not made yet.';
    } catch (e: any) {
      return `The business could not save this record online (${e?.message ?? 'refused'}).`;
    }
    const r = await setLogin(kind, id, email.trim(), password);
    return r.error ?? '';
  };

  const card = (
    <Card>
      <H2>Sign-in</H2>
      <SwitchRow
        label="Let them sign in to the app"
        sub={on ? `${who} signs in with this email and password.` : 'You can do this later from their page.'}
        value={on}
        onChange={setOn}
      />
      {on ? (
        <>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="name@example.com"
          />
          <View style={{ gap: 6 }}>
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoCapitalize="none"
              helper="At least 8 characters. Share it with them privately."
            />
            <Pressable onPress={() => setShow(!show)} accessibilityRole="button" hitSlop={8} style={st.show}>
              <Icon name="eye" size={18} color={colors.muted} />
              <Text style={st.showText}>{show ? 'Hide password' : 'Show password'}</Text>
            </Pressable>
          </View>
          {mode === 'demo' ? <Muted>Demo mode: no real account is made.</Muted> : null}
        </>
      ) : null}
    </Card>
  );

  return { card, check, create, on };
}

const st = StyleSheet.create({
  show: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  showText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
});
