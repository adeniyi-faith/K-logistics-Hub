// AI Assistant: passes the Admin's questions to Google's Gemini and returns its reply.
//
// This runs on Supabase (an "Edge Function"), not on the phone, so the Gemini key stays secret.
// It only talks to Gemini; it never reads the business data. When Gemini wants figures it replies
// with a request for one of the look-ups below. The phone runs that look-up on its own copy of the
// data (app/src/lib/assistantTools.ts) and sends the result back in the next call.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   GEMINI_API_KEY  the key from Google AI Studio (required)
//   GEMINI_MODEL    which Gemini model to use (optional, default below)
import { createClient } from 'npm:@supabase/supabase-js@2';

const DEFAULT_MODEL = 'gemini-3.7-flash';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const day = { type: 'string', description: 'A day as YYYY-MM-DD.' };
const range = {
  startDay: { ...day, description: 'First day, YYYY-MM-DD. Leave out for just the end day.' },
  endDay: { ...day, description: 'Last day, YYYY-MM-DD. Leave out for today (the open business day).' },
};

// The look-ups Gemini may ask for. Names must match app/src/lib/assistantTools.ts.
const TOOLS = [
  {
    name: 'money_summary',
    description:
      'Sales, number of orders, cost of goods, expenses and profit between two days, with a per-day breakdown for up to 31 days. ' +
      'Profit = sales − cost of goods (at current cost prices) − expenses. Failed orders are not counted.',
    parameters: { type: 'object', properties: range },
  },
  {
    name: 'product_sales',
    description: 'Units sold and sales value per product between two days, best sellers first.',
    parameters: { type: 'object', properties: range },
  },
  {
    name: 'stock',
    description:
      'Stock per product for one day: opening, received, delivered, adjusted (count changes for damage, expiry, returns or a ' +
      'recount: added minus taken off) and closing (closing = what is in store), waitingForDelivery (on pending orders, still ' +
      'in store), low-stock level, whether it is low, cost and selling price, nearest expiry and supplier.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Part of a product name to filter by. Leave out for all products.' },
        day: { ...day, description: 'Leave out for today.' },
      },
    },
  },
  {
    name: 'riders',
    description:
      'Each rider with deliveries completed, failed deliveries and earnings between two days, pay per delivery, phone, bike, ' +
      'and how many deliveries they have pending right now.',
    parameters: { type: 'object', properties: range },
  },
  {
    name: 'orders',
    description:
      'Orders taken between two days, newest first (at most 40 listed, with the full count and total value). ' +
      'Each has customer, area, rider, items, total, payment and status. With status "pending", or a code or phone, it looks at every day. ' +
      'Order numbers start with ORD- (older ones with S-).',
    parameters: {
      type: 'object',
      properties: {
        ...range,
        status: { type: 'string', enum: ['pending', 'delivered', 'failed'] },
        customer: { type: 'string', description: 'Part of a customer name.' },
        rider: { type: 'string', description: 'Part of a rider name.' },
        area: { type: 'string', description: 'Delivery area, e.g. Rumuola.' },
        code: { type: 'string', description: 'Part of an order number, e.g. ORD-1002-19. Searches every day.' },
        phone: { type: 'string', description: "Part of the customer's phone number. Searches every day." },
        product: { type: 'string', description: 'Part of a product name in the order.' },
      },
    },
  },
  {
    name: 'customers',
    description:
      'Customers with phone, area, number of orders, total bought (delivered orders), last order day and usual rider, biggest buyers first.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Part of a customer name.' },
        area: { type: 'string', description: 'Delivery area.' },
      },
    },
  },
  {
    name: 'expenses',
    description: 'Expenses between two days with category, note, amount, bike and who was paid (for staff and rider pay), and the total.',
    parameters: { type: 'object', properties: { ...range, category: { type: 'string', description: 'e.g. Fuel.' } } },
  },
];

function instructions(today: string, snapshot: string) {
  return `You are the AI Assistant in K-Logistics Hub, the app of a business in Port Harcourt, Nigeria that sells herbal and
health products to shops and people and delivers them with motorbike riders.

Today, the business day the app is recording, is ${today}. "This week" means the 7 days up to and including today, and
"this month" means from the 1st of this month to today, unless the person says otherwise.

How to answer:
- Get every figure from the look-ups. Never guess or make up a number, name or date. If the look-ups cannot answer, say so plainly.
- Money is in Naira. Write amounts like ₦21,500.
- Use short, plain English that a busy business owner can read in a few seconds. Start with the answer in one or two
  sentences. Add up to 6 short lines starting with "- " for the key figures only when they help.
- Plain text only: no headings, tables, bold or other formatting.
- You can only read the business data. If asked to change something, say which part of the app to use.
- Only answer questions about this business. Politely decline anything else.
- The business calls a sale an "order". Say "orders", not "sales".
${snapshot ? `
Figures already worked out (use them when they answer the question, so you need no look-up; use look-ups for anything else):
${snapshot}` : ''}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'The AI Assistant is not set up yet: the Gemini key is missing.' }, 500);

  // Only signed-in Admin accounts may use it (it can see every figure in the business).
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: role } = await supabase.rpc('my_role');
  if (role !== 'admin') return json({ error: 'Only Admin can use the AI Assistant.' }, 403);

  let body: { contents?: unknown; today?: unknown; snapshot?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'The request was not readable.' }, 400);
  }
  const contents = body.contents;
  const today = typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);
  if (!Array.isArray(contents) || contents.length === 0 || contents.length > 160) {
    return json({ error: 'The conversation was empty or too long.' }, 400);
  }

  // Today's figures from the phone, so most questions need no look-up. Capped to keep each call small.
  const known = body.snapshot && typeof body.snapshot === 'object' ? JSON.stringify(body.snapshot).slice(0, 12000) : '';

  const model = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL;
  const request = JSON.stringify({
    systemInstruction: { parts: [{ text: instructions(today, known) }] },
    contents,
    tools: [{ functionDeclarations: TOOLS }],
    // Quick answers matter more than deep reasoning for these questions.
    generationConfig: { thinkingConfig: { thinkingLevel: 'low' } },
  });
  // When Gemini is busy, wait a moment and try again (twice) before telling the person.
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: request,
    });
    if (!(res.status === 429 || res.status === 503) || attempt === 2) break;
    await res.body?.cancel();
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }

  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text());
    const busy = res.status === 429 || res.status === 503;
    return json({ error: busy ? 'Gemini is busy right now. Please try again in a minute.' : 'Gemini could not answer. Please try again.' }, 502);
  }

  const out = await res.json();
  const content = out?.candidates?.[0]?.content;
  if (!content?.parts?.length) {
    const blocked = out?.promptFeedback?.blockReason || out?.candidates?.[0]?.finishReason === 'SAFETY';
    return json({ error: blocked ? 'Gemini would not answer that question.' : 'Gemini gave an empty answer. Please try again.' }, 502);
  }
  // Sent back unchanged: Gemini needs its own "thought signatures" returned in the next call.
  return json({ content });
});
