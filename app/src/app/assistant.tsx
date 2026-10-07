// AI Assistant: ask anything about the business in plain English.
// The synced app asks Gemini (src/live/assistant.ts). Demo mode has no Gemini, so it answers
// common questions itself from the sample data (src/lib/assistant.ts).
import { Href, Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiIcon } from '../components/AskAiButton';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/ui';
import { Answer, demoAnswer, SUGGESTIONS } from '../lib/assistant';
import { askGemini, Turn } from '../live/assistant';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

type Message = { id: number; from: 'you' | 'ai'; text: string; answer?: Answer; failed?: boolean };

export default function Assistant() {
  const { state, mode } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [step, setStep] = useState('Thinking');
  const scroll = useRef<ScrollView>(null);
  const nextId = useRef(1);
  // The conversation so far in Gemini's own shape, so follow-up questions make sense to it.
  const history = useRef<Turn[]>([]);

  if (state.session?.role !== 'admin') return <Redirect href="/" />;

  const say = (answer: Answer, failed?: boolean) =>
    setMessages((m) => [...m, { id: nextId.current++, from: 'ai', text: answer.text, answer, failed }]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    setDraft('');
    setMessages((m) => [...m, { id: nextId.current++, from: 'you', text: q }]);
    setThinking(true);
    if (mode === 'live') {
      try {
        setStep('Thinking');
        const reply = await askGemini(state, history.current, q, setStep);
        history.current = reply.history;
        say({ text: reply.text });
      } catch (e) {
        say({ text: e instanceof Error ? e.message : 'The AI Assistant could not answer right now. Please try again.' }, true);
      }
      setThinking(false);
      return;
    }
    // Demo: a short pause so it feels like the real thing, which takes a moment to answer.
    setTimeout(() => {
      say(demoAnswer(state, q));
      setThinking(false);
    }, 700);
  };

  const first = state.session?.name.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar back sub="Ask about your business" title="AI Assistant" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          ref={scroll}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={st.list}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={st.welcome}>
              <View style={st.welcomeIcon}>
                <AiIcon name="spark" size={30} color={colors.orange} />
              </View>
              <Text style={st.welcomeTitle}>Hi {first}, what would you like to know?</Text>
              <Text style={st.welcomeSub}>Ask about orders, profit, stock, riders, customers or expenses.</Text>
              <Text style={st.tryLabel}>Try asking</Text>
              <View style={st.suggestions}>
                {SUGGESTIONS.map((q) => (
                  <Pressable key={q} onPress={() => ask(q)} accessibilityRole="button" style={st.suggestion}>
                    <Text style={st.suggestionText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {messages.map((m) =>
            m.from === 'you' ? (
              <YourBubble key={m.id} text={m.text} />
            ) : (
              <AiBubble key={m.id} answer={m.answer!} failed={m.failed} />
            ),
          )}

          {thinking ? (
            <View style={[st.aiRow]}>
              <View style={st.aiAvatar}>
                <AiIcon name="spark" size={16} color={colors.orange} />
              </View>
              <View style={[st.aiBubble, st.thinkingBubble]} accessibilityLiveRegion="polite">
                <Dots />
                <Text style={st.thinking}>{mode === 'live' ? `${step}…` : 'Thinking…'}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {messages.length > 0 ? (
          <ScrollView
            horizontal
            style={{ flexGrow: 0, flexShrink: 0 }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {SUGGESTIONS.map((q) => (
              <Pressable key={q} onPress={() => ask(q)} accessibilityRole="button" style={st.chip}>
                <Text style={st.chipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <SafeAreaView edges={['bottom']} style={st.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything about the business…"
            placeholderTextColor="#8A93A6"
            style={st.input}
            accessibilityLabel="Your question"
            multiline
            maxLength={2000}
            scrollEnabled
          />
          <Pressable
            onPress={() => ask(draft)}
            disabled={!draft.trim() || thinking}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[st.send, (!draft.trim() || thinking) && { opacity: 0.4 }]}
          >
            <AiIcon name="send" size={20} color={colors.navy} />
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function YourBubble({ text }: { text: string }) {
  return (
    <View style={st.youRow}>
      <View style={st.youBubble}>
        <Text style={st.youText}>{text}</Text>
      </View>
    </View>
  );
}

/** Three dots that pulse one after another while the answer is on its way. */
function Dots() {
  const v = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const pulse = (x: Animated.Value) =>
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ]);
    const loop = Animated.loop(Animated.stagger(180, v.map(pulse)));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={st.dots}>
      {v.map((x, i) => (
        <Animated.View key={i} style={[st.dot, { opacity: x, transform: [{ scale: x }] }]} />
      ))}
    </View>
  );
}

function AiBubble({ answer, failed }: { answer: Answer; failed?: boolean }) {
  return (
    <View style={st.aiRow}>
      <View style={st.aiAvatar}>
        <AiIcon name="spark" size={16} color={colors.orange} />
      </View>
      <View style={st.aiBubble}>
        <Text style={[st.aiText, failed && { color: colors.red }]}>{answer.text}</Text>
        {answer.facts?.length ? (
          <View style={st.facts}>
            {answer.facts.map((f, i) => (
              <View key={i} style={[st.fact, i > 0 && st.factBorder]}>
                <Text style={st.factLabel} numberOfLines={2}>
                  {f.label}
                </Text>
                <Text style={st.factValue}>{f.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {answer.links?.map((l) => (
          <Pressable key={l.href} onPress={() => router.push(l.href as Href)} accessibilityRole="link" style={st.link}>
            <Text style={st.linkText}>{l.label}</Text>
            <Icon name="chev" size={16} color={colors.orangeText} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  list: { padding: 16, gap: 14, paddingBottom: 20 },
  welcome: { alignItems: 'center', gap: 8, paddingTop: 16 },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  welcomeTitle: { fontFamily: fonts.head, fontSize: 20, color: colors.navy, textAlign: 'center' },
  welcomeSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 300 },
  tryLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 16, alignSelf: 'flex-start' },
  suggestions: { alignSelf: 'stretch', gap: 8 },
  suggestion: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.navy },
  youRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: 48 },
  youBubble: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  youText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white },
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingRight: 24 },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    padding: 14,
    gap: 10,
  },
  aiText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.navy },
  thinking: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
  thinkingBubble: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange },
  facts: { backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 12 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9 },
  factBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  factLabel: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  factValue: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  linkText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.orangeText },
  chipRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.navy },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 112, // About four lines; longer pasted text scrolls inside the box instead of growing it.
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
    backgroundColor: colors.bg,
    borderRadius: 24,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.navy,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
