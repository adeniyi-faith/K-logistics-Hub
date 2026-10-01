// Only used by engine.native.ts, so it is never part of the browser version.
// Delivery photos on phones. A photo is first kept in the app's own folder (so it
// survives with no signal), then uploaded to Supabase Storage when there's internet.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';
import { Directory, File, Paths } from 'expo-file-system';

export const BUCKET = 'delivery-photos';
const QUEUE_KEY = 'klh-photo-queue';

function folder(): Directory {
  const dir = new Directory(Paths.document, 'proofs');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Copies a just-taken photo into the app's folder and returns its storage name, e.g. "<order id>.jpg". */
export async function keepPhoto(orderId: string, uri: string): Promise<string> {
  const name = `${orderId}.jpg`;
  const target = new File(folder(), name);
  if (target.exists) target.delete();
  await new File(uri).copy(target);
  const queue = await readQueue();
  if (!queue.includes(name)) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, name]));
  return name;
}

/** The photo's file on this phone, if it is here. */
export function localPhoto(name: string): string | null {
  const f = new File(folder(), name);
  return f.exists ? f.uri : null;
}

async function readQueue(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]');
  } catch {
    return [];
  }
}

let running = false;

/** Uploads every photo still waiting. Safe to call often; does nothing while already running. */
export async function uploadWaitingPhotos(supabase: SupabaseClient): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    const queue = await readQueue();
    const left: string[] = [];
    for (const name of queue) {
      const file = new File(folder(), name);
      if (!file.exists) continue; // Nothing to send.
      try {
        const bytes = await file.bytes();
        const { error } = await supabase.storage.from(BUCKET).upload(name, bytes, { contentType: 'image/jpeg', upsert: true });
        if (error) left.push(name);
      } catch {
        left.push(name); // No internet: try again later.
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(left));
    return left.length;
  } finally {
    running = false;
  }
}

/** How many photos are still waiting to upload. */
export async function waitingPhotos(): Promise<number> {
  return (await readQueue()).length;
}
