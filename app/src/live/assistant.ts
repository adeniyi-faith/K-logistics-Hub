// Asks Gemini a question through the "assistant" function on Supabase (supabase/functions/assistant).
//
// One question can take a few calls: Gemini may first ask for figures (a "function call"),
// the phone works them out with runTool, sends them back, and Gemini then writes the answer.
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError, SupabaseClient } from '@supabase/supabase-js';

import { AppState } from '../data/types';
import { runTool } from '../lib/assistantTools';
import { shiftDay } from '../lib/stock';

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
    const res = error.context as Response;
    let body: { error?: unknown; message?: unknown; msg?: unknown; code?: unknown } | null = null;
    try {
      body = await res.json();
    } catch {}
    // Our own function always answers with { error: "..." } in plain words.
    if (typeof body?.error === 'string') return body.error;
    // Anything else came from Supabase before our code ran, so say what Admin can fix.
    if (res.status === 404)
      return 'The assistant function is not on Supabase yet (error 404). Deploy it in Edge Functions with the name "assistant".';
    if (res.status === 401)
      return 'Supabase turned the request away (error 401). In Edge Functions → assistant → Settings, turn off "Verify JWT" and save.';
    const detail = [body?.message, body?.msg, body?.code].find((x) => typeof x === 'string');
    return `The assistant function failed (error ${res.status}${detail ? `: ${detail}` : ''}). Check its Logs in Supabase.`;
  }
  if (error instanceof FunctionsRelayError)
    return 'Supabase could not reach the assistant function. Please try again in a minute.';
  return 'The AI Assistant could not answer right now. Please try again.';
}

/** What each look-up is called on the "thinking" line. */
const LOOKING_UP: Record<string, string> = {
  money_summary: 'sales and profit',
  product_sales: 'product sales',
  stock: 'stock',
  riders: 'riders',
  orders: 'orders',
  customers: 'customers',
  expenses: 'expenses',
};

/**
 * The figures most questions need, sent along with every question so Gemini can usually answer
 * in one go instead of asking for look-ups first (each look-up is another trip to Gemini).
 */
function snapshot(state: AppState) {
  const week = { startDay: shiftDay(state.day, -6), endDay: state.day };
  const pick = (name: string, args: Record<string, unknown> = {}) => runTool(state, name, args).result;
  const money = (r: unknown) => (r as { total?: unknown } | undefined)?.total;
  const stock = (pick('stock') as { product: string; closing: number; unit: string; isLow: boolean }[] | undefined) ?? [];
  return {
    today: money(pick('money_summary')),
    last7Days: { ...week, ...(money(pick('money_summary', week)) as object) },
    bestSellersLast7Days: ((pick('product_sales', week) as unknown[]) ?? []).slice(0, 5),
    lowStock: stock.filter((s) => s.isLow).map((s) => ({ product: s.product, inStore: s.closing, unit: s.unit })),
    ridersLast7Days: pick('riders', week),
    biggestCustomers: ((pick('customers') as unknown[]) ?? []).slice(0, 5),
  };
}

/**
 * Returns Gemini's answer, and the conversation to pass in with the next question.
 * onStep says what is happening, e.g. "Looking up stock…", for the "thinking" line.
 */
export async function askGemini(
  state: AppState,
  history: Turn[],
  question: string,
  onStep?: (step: string) => void,
): Promise<{ text: string; history: Turn[] }> {
  if (!client) throw new Error('The AI Assistant is not connected yet. Please sign in again.');
  const contents: Turn[] = [...trim(history), { role: 'user', parts: [{ text: question }] }];
  const known = snapshot(state);

  for (let round = 0; round < MAX_ROUNDS; round++) {
    onStep?.(round === 0 ? 'Thinking' : 'Writing the answer');
    const { data, error } = await client.functions.invoke('assistant', { body: { contents, today: state.day, snapshot: known } });
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
    onStep?.(`Looking up ${[...new Set(calls.map((c) => LOOKING_UP[c.functionCall!.name] ?? 'figures'))].join(' and ')}`);
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
