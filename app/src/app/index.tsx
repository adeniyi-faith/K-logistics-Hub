import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '../components/Icon';
import { Button, Card, Field, Muted } from '../components/ui';
import { Role } from '../data/types';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const HOME: Record<Role, '/admin' | '/rider' | '/staff'> = { admin: '/admin', rider: '/rider', staff: '/staff' };

export default function SignIn() {
  const { state, signInAs } = useStore();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');

  if (state.session) return <Redirect href={HOME[state.session.role]} />;

  const openAs = (role: Role) => {
    signInAs(role);
    router.replace(HOME[role]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.wrap}>
          <View style={st.brand}>
            <Image source={require('../../assets/logo.jpg')} style={st.logo} accessibilityLabel="K-Logistics Hub logo" />
            <Text style={st.brandName}>K-Logistics Hub</Text>
          </View>

          <Card style={{ gap: 16, padding: 20 }}>
            <View style={{ gap: 4 }}>
              <Text style={st.title}>Welcome back</Text>
              <Muted>Sign in to run today's business.</Muted>
            </View>
            <Field label="Phone number or email" value={login} onChangeText={setLogin} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <Button
              title="Sign in"
              kind="accent"
              onPress={() =>
                setNote('Real accounts come with the online database (next step). For now, use a demo button below.')
              }
            />
            {note ? <Text style={st.note}>{note}</Text> : null}

            <View style={st.demo}>
              <Text style={st.demoLabel}>DEMO — OPEN THE APP AS</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Admin" kind="ghost" onPress={() => openAs('admin')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Staff" kind="ghost" onPress={() => openAs('staff')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="Rider" kind="ghost" onPress={() => openAs('rider')} />
                </View>
              </View>
            </View>
          </Card>

          <View style={st.offline}>
            <Icon name="cloudok" size={18} color="#C9D3E6" />
            <Text style={st.offlineText}>Works without internet. Syncs when you're back online.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 10 },
  logo: { width: 72, height: 72, borderRadius: 18 },
  brandName: { fontFamily: fonts.head, fontSize: 20, color: colors.white },
  title: { fontFamily: fonts.head, fontSize: 22, color: colors.navy },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.orangeText },
  demo: { gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 },
  demoLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, letterSpacing: 0.5 },
  offline: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  offlineText: { fontFamily: fonts.body, fontSize: 13, color: '#C9D3E6' },
});
