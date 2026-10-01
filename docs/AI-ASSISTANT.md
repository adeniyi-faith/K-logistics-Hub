# AI Assistant (Gemini)

Admin can ask the app questions about the business in plain English, such as "What is our profit this week?" or "Which rider delivered the most yesterday?". Tap **Ask AI** at the bottom right of any Admin screen.

## How it works

1. You type a question on the phone.
2. The phone sends it to a small piece of our own code on Supabase, called the `assistant` function (`supabase/functions/assistant`). That code holds the Gemini key, so the key is never on anyone's phone.
3. The function passes the question to Google's Gemini, together with a list of things Gemini can look up: money for a date range, sales per product, stock, riders, orders, customers and expenses.
4. When Gemini needs figures, it asks for one of those look-ups. The phone works out the figures from its own synced copy of the data, using the same sums as the other screens (`app/src/lib/assistantTools.ts`), and sends them back. Gemini then writes the answer.
5. The answer shows on the Assistant screen. Follow-up questions such as "and yesterday?" work, because the last few questions are sent along too.

Good to know:

- Gemini can only **read** figures. It cannot change anything in the app.
- Only **Admin** accounts can use it. The function checks this every time.
- It needs **internet**. With no signal, the screen says so.
- In **demo mode** (no Supabase set up, or the browser version), there is no Gemini. The Assistant answers common questions itself from the sample data instead.

## Setting it up

1. **Get a Gemini key.** Go to [Google AI Studio](https://aistudio.google.com/apikey), sign in, and create an API key. Turn on billing for it if you need more than the free daily limit.
2. **Install the Supabase command-line tool** on your computer ([guide](https://supabase.com/docs/guides/cli)), then in the project folder run:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF   # the ref is in your Supabase project's web address
   npx supabase secrets set GEMINI_API_KEY=paste-your-key-here
   npx supabase functions deploy assistant
   ```

   You can also add the secret in the Supabase dashboard under **Edge Functions → Secrets**.
3. That's it. Open the app as Admin and tap **Ask AI**.

## Choosing the Gemini model

The function uses `gemini-3.8-flash` (the newest Flash 3 model) unless you choose another. To switch, set a second secret. No app update is needed:

```bash
npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash
```

Any Flash 3 model works, for example `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash` or `gemini-3.5-flash`. Newer ones handle harder questions better. Older ones and the "lite" ones are cheaper.

## Cost

Gemini charges a small amount for each question, based on how much text goes back and forth. One question usually takes one to three calls. See Google's [Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing) for current prices. You can see usage and set a spending limit in Google AI Studio.
