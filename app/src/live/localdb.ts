// The database on the phone (expo-sqlite). Only used by engine.native.ts.
import * as SQLite from 'expo-sqlite';

import { fixSql, resetSql, SCHEMA_VERSION, setupSql, TABLE_NAMES } from './schema';
import { Params, Runner, Sql } from './sync';

/** save: the app saved something on this phone. data: sync work (uploading, downloading). */
export type ChangeKind = 'save' | 'data';

export type LocalDb = Sql & {
  /** The same database for sync.ts: its changes do not count as "saved on this phone". */
  forSync: Sql;
  /** Called after anything is saved or downloaded. */
  onChange: (listener: (kind: ChangeKind) => void) => () => void;
  /** Forget everything on this phone (signing out). */
  clear: () => Promise<void>;
};

const BUSY_MS = 5000;

const runnerFor = (db: SQLite.SQLiteDatabase, changed: () => void): Runner => ({
  run: async (sql, params: Params = []) => {
    await db.runAsync(fixSql(sql), params);
    changed();
  },
  all: (sql, params: Params = []) => db.getAllAsync(fixSql(sql), params),
  first: (sql, params: Params = []) => db.getFirstAsync(fixSql(sql), params),
});

export async function openLocalDb(): Promise<LocalDb> {
  const db = await SQLite.openDatabaseAsync('k-logistics-sync.db');
  // WAL lets the app keep reading while a download is being saved; waiting (not failing) when both write.
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync(`PRAGMA busy_timeout = ${BUSY_MS}`);

  // A changed table layout: rebuild the downloaded copy (changes still waiting to upload are kept).
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) !== SCHEMA_VERSION) {
    for (const sql of resetSql()) {
      try {
        await db.execAsync(sql);
      } catch {
        // sync_meta does not exist on the very first start; nothing to reset.
      }
    }
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
  for (const sql of setupSql()) await db.execAsync(sql);

  const listeners = new Set<(kind: ChangeKind) => void>();
  const changed = (kind: ChangeKind) => listeners.forEach((l) => l(kind));
  const sqlFor = (kind: ChangeKind): Sql => ({
    ...runnerFor(db, () => changed(kind)),
    transaction: async (task) => {
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(`PRAGMA busy_timeout = ${BUSY_MS}`);
        await task(runnerFor(txn, () => {}));
      });
      changed(kind);
    },
  });

  const local: LocalDb = {
    ...sqlFor('save'),
    forSync: sqlFor('data'),
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear: async () => {
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync(`PRAGMA busy_timeout = ${BUSY_MS}`);
        // Switch the change-noting triggers off so clearing is not itself noted as deletions.
        await txn.runAsync("UPDATE sync_meta SET value = '1' WHERE key = 'applying'");
        for (const t of TABLE_NAMES) await txn.runAsync(`DELETE FROM ${t}`);
        await txn.runAsync('DELETE FROM sync_outbox');
        await txn.runAsync("DELETE FROM sync_meta WHERE key LIKE 'cursor:%'");
        await txn.runAsync("UPDATE sync_meta SET value = '0' WHERE key = 'applying'");
      });
      changed('data');
    },
  };
  return local;
}
