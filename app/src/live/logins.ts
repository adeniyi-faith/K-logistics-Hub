// Admin sets the email and password a staff member or rider signs in with.
// Runs through the "manage-login" function on Supabase (supabase/functions/manage-login),
// because making accounts needs a secret key that never goes on a phone.
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { liveClient } from './assistant';

export type LoginKind = 'staff' | 'rider';

// Demo mode: nothing is sent anywhere; this keeps what was typed until the app closes.
const demo = new Map<string, string>();

async function call(body: Record<string, unknown>): Promise<{ email?: string | null; error?: string }> {
  const client = liveClient();
  if (!client) {
    const key = `${body.kind}:${body.id}`;
    if (body.action === 'set') demo.set(key, String(body.email));
    return { email: demo.get(key) ?? null };
  }
  const { data, error } = await client.functions.invoke('manage-login', { body });
  if (!error) return data;
  if (error instanceof FunctionsFetchError) return { error: 'No internet. Setting sign-in details needs internet.' };
  if (error instanceof FunctionsHttpError) {
    try {
      const b = await error.context.json();
      if (b?.error) return { error: String(b.error) };
    } catch {}
    if (error.context.status === 404) return { error: 'The sign-in service is not set up yet (see docs/SETUP.md).' };
  }
  return { error: 'Could not reach the sign-in service. Please try again.' };
}

/** The email this person signs in with, or null if they have no sign-in yet. */
export async function getLogin(kind: LoginKind, id: string) {
  return call({ action: 'get', kind, id });
}

/** Creates their sign-in, or changes its email and (if given) password. */
export async function setLogin(kind: LoginKind, id: string, email: string, password: string) {
  return call({ action: 'set', kind, id, email, password: password || undefined });
}
