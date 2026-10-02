import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BusinessLogo } from '../components/BusinessLogo';
import { Icon } from '../components/Icon';
import { IconName } from '../components/icons';
import { Text, TextInput } from '../components/Text';
import { Button } from '../components/ui';
import { Role } from '../data/types';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const HOME: Record<Role, '/admin' | '/rider' | '/staff'> = { admin: '/admin', rider: '/rider', staff: '/staff' };

/** A box with an icon in front, e.g. the email and password boxes. */
function IconField({
  icon,
  label,
  right,
  ...input
}: React.ComponentProps<typeof TextInput> & { icon: IconName; label: string; right?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.field, focused && st.fieldOn]}>
        <Icon name={icon} size={20} color={focused ? colors.orange : colors.muted} />
        <TextInput
          placeholderTextColor="#98A1B3"
          style={st.input}
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...input}
        />
        {right}
      </View>
    </View>
  );
}

export default function SignIn() {
  const { state, mode, phase, signInAs, signIn, signOut, sendResetCode, resetPassword } = useStore();
  // forgot: asking for a code by email. reset: typing the code and a new password.
  const [view, setView] = useState<'signin' | 'forgot' | 'reset'>('signin');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');
  const [slow, setSlow] = useState(false);

  // Still "getting your account ready" after a while: say what might be wrong and offer a way out.
  useEffect(() => {
    if (phase !== 'loading') return setSlow(false);
    const t = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(t);
  }, [phase]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Demo buttons are for trying the app in the browser or while building it. Real phone builds
  // (preview and store) never show them, even if the Supabase details were left out.
  const showDemo = mode === 'demo' && (__DEV__ || Platform.OS === 'web');

  if (state.session) return <Redirect href={HOME[state.session.role]} />;

  const submit = async () => {
    if (!login.trim() || !password) return setNote('Enter your email and password.');
    setBusy(true);
    setNote('');
    const error = await signIn(login.trim(), password);
    setBusy(false);
    if (error) setNote(error);
  };

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.trim())) return setNote('Enter the email you sign in with.');
    setBusy(true);
    setNote('');
    const error = await sendResetCode(login.trim());
    setBusy(false);
    if (error) return setNote(error);
    setInfo(`We sent a code to ${login.trim()}. It can take a minute; check spam too.`);
    setView('reset');
  };

  const saveNewPassword = async () => {
    if (!code.trim()) return setNote('Enter the code from the email.');
    if (newPassword.length < 8) return setNote('The new password needs at least 8 characters.');
    setBusy(true);
    setNote('');
    const error = await resetPassword(login.trim(), code, newPassword);
    setBusy(false);
    if (error) setNote(error);
  };

  const go = (v: typeof view) => {
    setNote('');
    setInfo('');
    setView(v);
  };

  const openAs = (role: Role) => {
    signInAs(role);
    router.replace(HOME[role]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, overflow: 'hidden' }}>
      <StatusBar style="light" />
      {/* Soft circles behind the logo. */}
      <View style={[st.circle, { width: 420, height: 420, top: -180, right: -160, backgroundColor: colors.navy2 }]} />
      <View style={[st.circle, { width: 220, height: 220, top: 120, left: -120, backgroundColor: 'rgba(233,125,1,0.16)' }]} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={st.hero}>
              <BusinessLogo style={st.logo} />
              <Text style={st.brandName}>{state.settings.businessName}</Text>
              {state.settings.tagline ? <Text style={st.tagline}>{state.settings.tagline}</Text> : null}
            </View>

            <View style={st.sheet}>
              <View style={{ gap: 4 }}>
                <Text style={st.title}>{view === 'signin' ? 'Sign in' : 'New password'}</Text>
                <Text style={st.sub}>
                  {view === 'signin'
                    ? "Welcome back. Let's run today's business."
                    : view === 'forgot'
                      ? "Enter your email and we'll send you a code to set a new password."
                      : info}
                </Text>
              </View>

              {phase === 'blocked' ? (
                <View style={{ gap: 16 }}>
                  <View style={st.note}>
                    <Icon name="lock" size={18} color={colors.red} />
                    <Text style={st.noteText}>Your access to the app has been turned off. Ask Admin if this is a mistake.</Text>
                  </View>
                  <Button title="Sign out" kind="ghost" onPress={signOut} />
                </View>
              ) : phase === 'loading' ? (
                <View style={{ gap: 16 }}>
                  <Text style={st.sub}>Getting your account ready. This needs internet the first time.</Text>
                  {slow ? (
                    <>
                      <Text style={st.sub}>
                        This is taking long. Check your internet. If it keeps happening, your account may not be set up yet; ask
                        Admin to check your sign-in details.
                      </Text>
                      <Button title="Sign out" kind="ghost" onPress={signOut} />
                    </>
                  ) : null}
                </View>
              ) : view === 'forgot' ? (
                <View style={{ gap: 16 }}>
                  <IconField
                    icon="user"
                    label="Email"
                    placeholder="you@example.com"
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={sendCode}
                  />
                  {note ? (
                    <View style={st.note}>
                      <Icon name="alert" size={18} color={colors.red} />
                      <Text style={st.noteText}>{note}</Text>
                    </View>
                  ) : null}
                  <Button title={busy ? 'Sending…' : 'Send code'} kind="accent" onPress={sendCode} disabled={busy} />
                  <Pressable onPress={() => go('signin')} accessibilityRole="button" style={st.linkBtn}>
                    <Text style={st.link}>Back to sign in</Text>
                  </Pressable>
                </View>
              ) : view === 'reset' ? (
                <View style={{ gap: 16 }}>
                  <IconField
                    icon="lock"
                    label="Code from the email"
                    placeholder="6-digit code"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                  />
                  <IconField
                    icon="lock"
                    label="New password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!show}
                    autoComplete="new-password"
                    returnKeyType="go"
                    onSubmitEditing={saveNewPassword}
                    right={
                      <Pressable
                        onPress={() => setShow(!show)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={show ? 'Hide password' : 'Show password'}
                      >
                        <Icon name="eye" size={20} color={show ? colors.navy : colors.muted} />
                      </Pressable>
                    }
                  />
                  {note ? (
                    <View style={st.note}>
                      <Icon name="alert" size={18} color={colors.red} />
                      <Text style={st.noteText}>{note}</Text>
                    </View>
                  ) : null}
                  <Button title={busy ? 'Saving…' : 'Save and sign in'} kind="accent" onPress={saveNewPassword} disabled={busy} />
                  <Pressable onPress={() => go('forgot')} accessibilityRole="button" style={st.linkBtn}>
                    <Text style={st.link}>Send a new code</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  <IconField
                    icon="user"
                    label="Email"
                    placeholder="you@example.com"
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    returnKeyType="next"
                  />
                  <IconField
                    icon="lock"
                    label="Password"
                    placeholder="Your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!show}
                    autoComplete="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    right={
                      <Pressable
                        onPress={() => setShow(!show)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={show ? 'Hide password' : 'Show password'}
                      >
                        <Icon name="eye" size={20} color={show ? colors.navy : colors.muted} />
                      </Pressable>
                    }
                  />
                  {note ? (
                    <View style={st.note}>
                      <Icon name="alert" size={18} color={colors.red} />
                      <Text style={st.noteText}>{note}</Text>
                    </View>
                  ) : null}
                  <Button title={busy ? 'Signing in…' : 'Sign in'} kind="accent" onPress={submit} disabled={busy} />
                  <Pressable onPress={() => go('forgot')} accessibilityRole="button" style={st.linkBtn}>
                    <Text style={st.link}>Forgot password?</Text>
                  </Pressable>
                </View>
              )}

              {showDemo && view === 'signin' ? (
                <View style={st.demo}>
                  <View style={st.orRow}>
                    <View style={st.orLine} />
                    <Text style={st.orText}>or try the demo as</Text>
                    <View style={st.orLine} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['admin', 'staff', 'rider'] as Role[]).map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => openAs(r)}
                        accessibilityRole="button"
                        style={({ pressed }) => [st.demoBtn, pressed && { backgroundColor: colors.grayBg }]}
                      >
                        <Text style={st.demoText}>{r === 'admin' ? 'Admin' : r === 'staff' ? 'Staff' : 'Rider'}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  circle: { position: 'absolute', borderRadius: 999 },
  hero: {
    flex: 1,
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logo: { width: 96, height: 96, borderRadius: 28, backgroundColor: colors.white, marginBottom: 6 },
  brandName: { fontFamily: fonts.head, fontSize: 22, color: colors.white, textAlign: 'center' },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: '#C9D3E6', textAlign: 'center' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 22,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.headBold, fontSize: 26, color: colors.navy },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  fieldOn: { borderColor: colors.orange, backgroundColor: colors.white },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 16, color: colors.navy, paddingVertical: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.redBg },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.red },
  demo: { gap: 12 },
  linkBtn: { alignSelf: 'center', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  link: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.orangeText },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.line },
  orText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  demoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
});
