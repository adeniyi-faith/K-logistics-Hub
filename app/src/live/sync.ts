// Our own sync between the phone's database and Supabase. No native code in here.
//
// Upload (push): every change the app makes is noted in sync_outbox (see schema.ts).
//   We send them oldest first. If there is no internet we stop and try again later.
// Download (pull): each table is asked for rows that changed since the last time
//   (updated_at, a column the server sets), plus a list of deleted rows (sync_deletes).
//   Rows with a change still waiting to upload are left alone, so a download never
//   overwrites something typed on this phone.
import type { SupabaseClient } from '@supabase/supabase-js';

import { ColKind, TABLES, YES_NO } from './schema';

export type Params = (string | number | null)[];

/** What the sync needs from the phone's database (expo-sqlite in the app, node:sqlite in the tests). */
export type Runner = {
  run: (sql: string, params?: Params) => Promise<void>;
  all: <T = Record<string, any>>(sql: string, params?: Params) => Promise<T[]>;
  first: <T = Record<string, any>>(sql: string, params?: Params) => Promise<T | null>;
};
export type Sql = Runner & { transaction: (task: (tx: Runner) => Promise<void>) => Promise<void> };

type Row = Record<string, any>;
type Outcome = 'done' | 'offline' | 'error';

// Postgres error codes that will never succeed on retry (bad data, or not allowed).
const FATAL = [/^22...$/, /^23...$/, /^42501$/, /^42P01$/, /^PGRST20.$/];
const PAGE = 500;
/** Re-ask for this long before the last change we saw, in case a change was saved late. */
const OVERLAP_MS = 2 * 60 * 1000;
const DELETE_OVERLAP = 100;

const isFatal = (e: any) => typeof e?.code === 'string' && FATAL.some((r) => r.test(e.code));
/** The server never answered (no signal), as opposed to the server saying no. */
const isOffline = (e: any) => e?.code === '' || /network|fetch|timed? ?out|offline|internet/i.test(String(e?.message ?? ''));

export const waitingCount = async (sql: Runner) =>
  (await sql.first<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox'))?.n ?? 0;

// ------------------------------------------------------------- value conversion

function toRemote(table: string, col: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (YES_NO.includes(col)) return Boolean(value);
  if (TABLES[table].cols[col] === 'json' && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function toLocal(kind: ColKind, col: string, value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (kind === 'json') return typeof value === 'string' ? value : JSON.stringify(value);
  if (YES_NO.includes(col)) return value ? 1 : 0;
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number;
}

// ------------------------------------------------------------------------ push

async function sendOne(remote: SupabaseClient, row: Row, by: string) {
  const table = remote.from(row.tbl);
  const id = String(row.row_id);
  const cols = Object.keys(TABLES[row.tbl].cols);
  let result: { error: any };

  if (row.op === 'DELETE') {
    result = await table.delete().eq('id', id);
  } else {
    const now = JSON.parse(row.data) as Row;
    if (row.op === 'PUT') {
      const body: Row = { id };
      for (const c of cols) body[c] = toRemote(row.tbl, c, now[c]);
      result = await table.upsert(body);
    } else {
      const before = (row.prev ? JSON.parse(row.prev) : {}) as Row;
      const changed = cols.filter((c) => now[c] !== before[c]);
      if (!changed.length) return; // Saved again with nothing different.
      const pNew: Row = {};
      const pOld: Row = {};
      for (const c of changed) {
        pNew[c] = toRemote(row.tbl, c, now[c]);
        pOld[c] = toRemote(row.tbl, c, before[c]);
      }
      result = TABLES[row.tbl].clash
        ? // The server saves what nobody else changed meanwhile, and records a clash for the rest.
          await remote.rpc('save_change', { p_table: row.tbl, p_id: id, p_new: pNew, p_old: pOld, p_by: by })
        : await table.update(pNew).eq('id', id);
    }
  }
  if (result.error) throw result.error;
}

/**
 * Notes a refused change and undoes it on this phone: a new row the server does not have is
 * removed, and the table is downloaded again in full so changed or deleted rows come back.
 */
async function refused(sql: Sql, row: Row, e: any) {
  const reason = String(e?.code === '42501' ? 'Not allowed' : (e?.message ?? e?.code ?? 'Refused')).slice(0, 200);
  await sql.transaction(async (tx) => {
    await tx.run('INSERT INTO sync_refused (tbl, op, row_id, at, reason) VALUES (?, ?, ?, ?, ?)', [
      row.tbl,
      row.op,
      String(row.row_id),
      new Date().toISOString(),
      reason,
    ]);
    if (row.op === 'PUT' && TABLES[row.tbl]) {
      const later = await tx.first('SELECT 1 AS x FROM sync_outbox WHERE tbl = ? AND row_id = ? AND seq > ? LIMIT 1', [
        row.tbl,
        row.row_id,
        row.seq,
      ]);
      if (!later) {
        await tx.run("UPDATE sync_meta SET value = '1' WHERE key = 'applying'");
        await tx.run(`DELETE FROM ${row.tbl} WHERE id = ?`, [String(row.row_id)]);
        await tx.run("UPDATE sync_meta SET value = '0' WHERE key = 'applying'");
      }
    }
    await tx.run('DELETE FROM sync_meta WHERE key = ?', [`cursor:${row.tbl}`]);
  });
}

/** Sends the waiting changes, oldest first. Stops at the first one that cannot be sent right now. */
export async function push(sql: Sql, remote: SupabaseClient, by: () => string): Promise<Outcome> {
  for (;;) {
    const row = await sql.first('SELECT * FROM sync_outbox ORDER BY seq LIMIT 1');
    if (!row) return 'done';
    try {
      await sendOne(remote, row, by());
    } catch (e: any) {
      if (isFatal(e)) {
        // The server refused this change for good (e.g. not allowed). Drop it so the queue
        // does not get stuck, note it for the Sync centre, and put the phone back in line.
        console.warn('Change refused by the server and discarded', e);
        await refused(sql, row, e);
      } else {
        return isOffline(e) ? 'offline' : 'error';
      }
    }
    await sql.run('DELETE FROM sync_outbox WHERE seq = ?', [row.seq]);
  }
}

// ------------------------------------------------------------------------ pull

const getMeta = async (sql: Runner, key: string) =>
  (await sql.first<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', [key]))?.value ?? null;
const setMeta = (sql: Runner, key: string, value: string) =>
  sql.run('INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);

/** An ISO time a little before the given server time (read to the second, which is safe on every phone). */
function earlier(serverTime: string): string {
  const ms = Date.parse(`${serverTime.slice(0, 19)}Z`);
  return Number.isNaN(ms) ? '1970-01-01T00:00:00Z' : new Date(ms - OVERLAP_MS).toISOString();
}

/** Columns this person may download. Riders never get cost prices. */
function wanted(table: string, role: string | null): string[] {
  const cols = Object.keys(TABLES[table].cols);
  return table === 'products' && role === 'rider' ? cols.filter((c) => c !== 'cost_price') : cols;
}

async function fetchChanged(remote: SupabaseClient, table: string, cols: string[], since: string | null) {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = remote.from(table).select(['id', ...cols, 'updated_at'].join(', '));
    if (since) q = q.gte('updated_at', earlier(since));
    const { data, error } = await q
      .order('updated_at')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as Row[]));
    if ((data?.length ?? 0) < PAGE) return rows;
  }
}

async function apply(sql: Sql, table: string, cols: string[], rows: Row[]) {
  if (!rows.length) return;
  const kinds = TABLES[table].cols;
  await sql.transaction(async (tx) => {
    // Downloaded rows are not changes to upload: switch the change-noting triggers off.
    await tx.run("UPDATE sync_meta SET value = '1' WHERE key = 'applying'");
    const waiting = new Set(
      (await tx.all<{ row_id: string }>('SELECT row_id FROM sync_outbox WHERE tbl = ?', [table])).map((r) => r.row_id),
    );
    const insert = `INSERT INTO ${table} (id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})
      ON CONFLICT(id) DO UPDATE SET ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}`;
    for (const row of rows) {
      if (waiting.has(String(row.id))) continue;
      await tx.run(insert, [String(row.id), ...cols.map((c) => toLocal(kinds[c], c, row[c]))]);
    }
    const last = rows[rows.length - 1].updated_at;
    if (typeof last === 'string') await setMeta(tx, `cursor:${table}`, last);
    await tx.run("UPDATE sync_meta SET value = '0' WHERE key = 'applying'");
  });
}

async function applyDeletes(sql: Sql, remote: SupabaseClient) {
  const cursor = Number((await getMeta(sql, 'cursor:deletes')) ?? 0);
  const from = Math.max(0, cursor - DELETE_OVERLAP);
  const found: { id: number; table_name: string; row_id: string }[] = [];
  for (let start = 0; ; start += PAGE) {
    const { data, error } = await remote
      .from('sync_deletes')
      .select('id, table_name, row_id')
      .gt('id', from)
      .order('id')
      .range(start, start + PAGE - 1);
    if (error) throw error;
    found.push(...((data ?? []) as typeof found));
    if ((data?.length ?? 0) < PAGE) break;
  }
  if (!found.length) return;
  await sql.transaction(async (tx) => {
    await tx.run("UPDATE sync_meta SET value = '1' WHERE key = 'applying'");
    for (const d of found) {
      if (!TABLES[d.table_name]) continue; // Only ever delete from our own tables.
      const waiting = await tx.first('SELECT 1 AS x FROM sync_outbox WHERE tbl = ? AND row_id = ? LIMIT 1', [
        d.table_name,
        d.row_id,
      ]);
      if (!waiting) await tx.run(`DELETE FROM ${d.table_name} WHERE id = ?`, [d.row_id]);
    }
    await setMeta(tx, 'cursor:deletes', String(found[found.length - 1].id));
    await tx.run("UPDATE sync_meta SET value = '0' WHERE key = 'applying'");
  });
}

/** Downloads what changed on the server. `userId` is the signed-in person. */
export async function pull(sql: Sql, remote: SupabaseClient, userId: string): Promise<Outcome> {
  try {
    const download = async (table: string, role: string | null) => {
      const cols = wanted(table, role);
      const rows = await fetchChanged(remote, table, cols, await getMeta(sql, `cursor:${table}`));
      await apply(sql, table, cols, rows);
    };
    // The person's own profile first: their role decides what else they may download.
    await download('profiles', null);
    const role = (await sql.first<{ role: string }>('SELECT role FROM profiles WHERE id = ?', [userId]))?.role ?? null;
    if (!role) return 'done'; // No profile yet (or none for this account): nothing more to download.
    for (const table of Object.keys(TABLES)) {
      if (table === 'profiles') continue;
      // Only Admin may read sync clashes.
      if (table === 'sync_clashes' && role !== 'admin') continue;
      await download(table, role);
    }
    await applyDeletes(sql, remote);
    return 'done';
  } catch (e: any) {
    if (!isOffline(e)) console.warn('Download from the server failed', e);
    return isOffline(e) ? 'offline' : 'error';
  }
}
