// Asks Gemini a question through the "assistant" function on Supabase (supabase/functions/assistant).
//
// One question can take a few calls: Gemini may first ask for figures (a "function call"),
// the phone works them out with runTool, sends them back, and Gemini then writes the answer.
import { FunctionsFetchError, FunctionsHttpError, SupabaseClient } from '@supabase/supabase-js';

import { AppState } from '../data/types';
import { runTool } from '../lib/assistantTools';

type Part = {
  text?: string;
  thought?: boolean;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  [key: string]: unknown;
};
/** One turn of the conversation, in Gemini's own shape so it can be sent back as it came. */
export type Turn = { role: 'user' | 'model'; parts: Part[] };

let client: SupabaseClient | null = null;

/** The live engine hands over its signed-in Supabase connection here. */
export function connectAssistant(c: SupabaseClient) {
  client = c;
}

/** The signed-in Supabase connection, for other server functions (e.g. live/logins.ts). Null in demo mode. */
export function liveClient(): SupabaseClient | null {
  return client;
}

/** Gemini may ask for figures this many times for one question before we give up. */
const MAX_ROUNDS = 6;
/** How many earlier questions (with their answers) are sent along, so follow-ups like "and yesterday?" work. */
const KEEP_QUESTIONS = 6;

/** Drops the oldest questions, always cutting just before a question so each answer stays whole. */
function trim(history: Turn[]): Turn[] {
  const starts = history.flatMap((t, i) => (t.role === 'user' && t.parts.some((p) => typeof p.text === 'string') ? [i] : []));
  return starts.length > KEEP_QUESTIONS ? history.slice(starts[starts.length - KEEP_QUESTIONS]) : history;
}

async function readError(error: unknown): Promise<string> {
  if (error instanceof FunctionsFetchError) return 'No internet connection. The AI Assistant needs internet to answer.';
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await (error.context as Response).json();
      if (typeof body?.error === 'string') return body.error;
    } catch {}
  }
  return 'The AI Assistant could not answer right now. Please try again.';
}

/** Returns Gemini's answer, and the conversation to pass in with the next question. */
export async function askGemini(state: AppState, history: Turn[], question: string): Promise<{ text: string; history: Turn[] }> {
  if (!client) throw new Error('The AI Assistant is not connected yet. Please sign in again.');
  const contents: Turn[] = [...trim(history), { role: 'user', parts: [{ text: question }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { data, error } = await client.functions.invoke('assistant', { body: { contents, today: state.day } });
    if (error) throw new Error(await readError(error));
    const reply = (data as { content?: Turn })?.content;
    if (!reply?.parts) throw new Error('The AI Assistant gave an empty answer. Please try again.');
    contents.push({ role: 'model', parts: reply.parts });

    const calls = reply.parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = reply.parts
        .filter((p) => typeof p.text === 'string' && !p.thought)
        .map((p) => p.text)
        .join('')
        .trim();
      return { text: text || 'Sorry, I could not find an answer to that.', history: contents };
    }

    // Work out each figure Gemini asked for and send them all back together.
    contents.push({
      role: 'user',
      parts: calls.map(({ functionCall }) => ({
        functionResponse: {
          name: functionCall!.name,
          ...(functionCall!.id ? { id: functionCall!.id } : {}),
          response: runTool(state, functionCall!.name, functionCall!.args),
        },
      })),
    });
  }
  throw new Error('That question needed too many look-ups. Please ask something more specific.');
}
