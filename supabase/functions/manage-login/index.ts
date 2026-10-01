// Lets Admin give a staff member or rider an email and password to sign in with, or change them.
//
// Making accounts needs Supabase's secret "service role" key. It is only available here on
// Supabase's servers (an "Edge Function"), never on a phone. Every call checks that the person
// asking is a signed-in Admin before doing anything.
//
// Deploy once: npx supabase functions deploy manage-login
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  // Who is asking: their own sign-in, checked by Supabase.
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user) return json({ error: 'Please sign in again.' }, 401);

  const server = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: me } = await server.from('profiles').select('role, can_sign_in').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin' || !me.can_sign_in) return json({ error: 'Only Admin can set sign-in details.' }, 403);

  let body: { action?: string; kind?: string; id?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
  const { action, kind, id } = body;
  if (kind !== 'staff' && kind !== 'rider') return json({ error: 'Bad request.' }, 400);
  if (!id || !UUID.test(id)) return json({ error: 'Bad request.' }, 400);

  const table = kind === 'staff' ? 'staff' : 'riders';
  const link = kind === 'staff' ? 'staff_id' : 'rider_id';
  const { data: person } = await server.from(table).select('id, name').eq('id', id).maybeSingle();
  if (!person) return json({ error: `This ${kind} isn't online yet. Try again once their record has uploaded.` }, 404);
  const { data: profile } = await server.from('profiles').select('id').eq(link, id).maybeSingle();

  if (action === 'get') {
    if (!profile) return json({ email: null });
    const { data } = await server.auth.admin.getUserById(profile.id);
    return json({ email: data.user?.email ?? null });
  }

  if (action !== 'set') return json({ error: 'Bad request.' }, 400);
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = body.password ? String(body.password) : '';
  if (!EMAIL.test(email)) return json({ error: 'Enter a proper email address.' }, 400);
  if (password && password.length < 8) return json({ error: 'The password needs at least 8 characters.' }, 400);

  const taken = (m: string) => /already|registered|exists/i.test(m);

  if (profile) {
    const { error } = await server.auth.admin.updateUserById(profile.id, {
      email,
      email_confirm: true,
      ...(password ? { password } : {}),
    });
    if (error) return json({ error: taken(error.message) ? 'Another account already uses this email.' : error.message }, 400);
    return json({ email });
  }

  if (!password) return json({ error: 'Enter a password for their first sign-in.' }, 400);
  const { data: created, error } = await server.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !created.user) {
    return json({ error: error && taken(error.message) ? 'Another account already uses this email.' : (error?.message ?? 'Could not create the account.') }, 400);
  }
  const { error: linkError } = await server.from('profiles').insert({
    id: created.user.id,
    name: person.name,
    role: kind,
    [link]: id,
  });
  if (linkError) {
    // Don't leave an account behind that isn't linked to anyone.
    await server.auth.admin.deleteUser(created.user.id);
    return json({ error: linkError.message }, 400);
  }
  return json({ email });
});
