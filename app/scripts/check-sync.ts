// Checks the sync logic (src/live/schema.ts and sync.ts) on a pretend phone and a pretend server.
// Run from the app folder:  npx tsx scripts/check-sync.ts
// It uses Node's built-in SQLite, so no phone is needed.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import { fixSql, setupSql } from '../src/live/schema';
import { pull, push, Runner, Sql } from '../src/live/sync';

// ------------------------------------------------------------- pretend phone

function phone(): Sql & { db: DatabaseSync } {
  const db = new DatabaseSync(':memory:');
  for (const s of setupSql()) db.exec(s);
  const runner: Runner = {
    run: async (sql, params = []) => void db.prepare(fixSql(sql)).run(...params),
    all: async (sql, params = []) => db.prepare(fixSql(sql)).all(...params) as any[],
    first: async (sql, params = []) => ((db.prepare(fixSql(sql)).get(...params) as any) ?? null),
  };
  return {
    ...runner,
    db,
    transaction: async (task) => {
      db.exec('BEGIN');
      try {
        await task(runner);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

// ------------------------------------------------------------ pretend server

type Row = Record<string, any>;
function server() {
  const tables: Record<string, Row[]> = {};
  const deletes: Row[] = [];
  const log: { rpc: any[]; selects: Record<string, string>; failWith: any } = { rpc: [], selects: {}, failWith: null };
  let clock = 0;
  const stamp = () => new Date(Date.UTC(2026, 9, 1, 12, 0, 0) + ++clock * 1000).toISOString().replace('Z', '+00:00');
  const rows = (t: string) => (tables[t] ??= []);

  const builder = (table: string) => {
    let mode: 'select' | 'update' | 'delete' | 'upsert' = 'select';
    let body: Row = {};
    const filters: ((r: Row) => boolean)[] = [];
    let order: string[] = [];
    let slice: [number, number] | null = null;
    const exec = () => {
      if (log.failWith) return { data: null, error: log.failWith };
      const list = rows(table);
      if (mode === 'upsert') {
        const i = list.findIndex((r) => r.id === body.id);
        if (i >= 0) list[i] = { ...list[i], ...body, updated_at: stamp() };
        else list.push({ ...body, updated_at: stamp() });
        return { data: null, error: null };
      }
      const hit = list.filter((r) => filters.every((f) => f(r)));
      if (mode === 'update') {
        hit.forEach((r) => Object.assign(r, body, { updated_at: stamp() }));
        return { data: null, error: null };
      }
      if (mode === 'delete') {
        hit.forEach((r) => {
          list.splice(list.indexOf(r), 1);
          deletes.push({ id: deletes.length + 1, table_name: table, row_id: r.id });
        });
        return { data: null, error: null };
      }
      let out = [...hit];
      for (const col of [...order].reverse()) out.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0));
      if (slice) out = out.slice(slice[0], slice[1] + 1);
      return { data: out, error: null };
    };
    const b: any = {
      select: (cols: string) => {
        log.selects[table] = cols;
        return b;
      },
      upsert: (r: Row) => ((mode = 'upsert'), (body = r), b),
      update: (r: Row) => ((mode = 'update'), (body = r), b),
      delete: () => ((mode = 'delete'), b),
      eq: (c: string, v: any) => (filters.push((r) => r[c] === v), b),
      gt: (c: string, v: any) => (filters.push((r) => r[c] > v), b),
      gte: (c: string, v: any) => (filters.push((r) => r[c] >= v), b),
      order: (c: string) => (order.push(c), b),
      range: (a: number, z: number) => ((slice = [a, z]), b),
      then: (ok: any, bad: any) => Promise.resolve(exec()).then(ok, bad),
    };
    return b;
  };
  const client: any = {
    from: (t: string) => (t === 'sync_deletes' ? builder('sync_deletes_view') : builder(t)),
    rpc: async (name: string, args: any) => {
      if (log.failWith) return { error: log.failWith };
      log.rpc.push({ name, args });
      const list = rows(args.p_table);
      const r = list.find((x) => x.id === args.p_id);
      if (r) Object.assign(r, args.p_new, { updated_at: stamp() });
      return { error: null };
    },
  };
  // sync_deletes is a view of the delete log.
  Object.defineProperty(tables, 'sync_deletes_view', { get: () => deletes });
  return { client, tables, log };
}

const count = async (p: Sql, t: string) => (await p.first<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`))!.n;

async function main() {
  const srv = server();
  const A = phone();
  const B = phone();

  // The server already knows the admin (so a phone can find its role) and one product.
  srv.tables.profiles = [{ id: 'admin1', name: 'Kasim', role: 'admin', rider_id: null, staff_id: null, can_sign_in: true, updated_at: '2026-10-01T00:00:00+00:00' }];
  srv.tables.products = [
    { id: 'p1', name: 'Mullein', product_group: 'Herbal teas', unit: 'box', pack: '', cost_price: 14000, sell_price: 21500, low_at: 10, nafdac: '', supplier: 'Bioharb', active: true, updated_at: '2026-10-01T00:00:01+00:00' },
  ];

  // 1. First download on phone A.
  assert.equal(await pull(A, srv.client, 'admin1'), 'done');
  assert.equal(await count(A, 'products'), 1);
  assert.equal((await A.first<any>("SELECT active FROM products WHERE id = 'p1'"))!.active, 1, 'true becomes 1 on the phone');
  assert.equal(await count(A, 'sync_outbox'), 0, 'downloading must not note changes to upload');

  // 2. Saving on the phone notes changes, in order.
  await A.run("INSERT INTO orders (id, code, day, customer, payment, status) VALUES ('o1', 'K-1', '2026-10-01', 'Ada', 'transfer', 'pending')");
  await A.run("INSERT INTO order_items (id, order_id, product_id, qty, unit_price) VALUES (uuid(), 'o1', 'p1', 2, 21500)");
  const waiting = await A.all<any>('SELECT tbl, op FROM sync_outbox ORDER BY seq');
  assert.deepEqual(waiting.map((w) => `${w.op} ${w.tbl}`), ['PUT orders', 'PUT order_items']);
  const item = await A.first<any>('SELECT id FROM order_items');
  assert.match(item.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/, 'uuid() makes real uuids');

  // 3. Uploading sends them and empties the list.
  assert.equal(await push(A, srv.client, () => 'Kasim'), 'done');
  assert.equal(await count(A, 'sync_outbox'), 0);
  assert.equal(srv.tables.orders.length, 1);
  assert.equal(srv.tables.order_items[0].qty, 2);

  // 4. Changing a product sends only what changed, through the clash check, as true/false.
  await A.run("UPDATE products SET sell_price = 23000 WHERE id = 'p1'");
  await push(A, srv.client, () => 'Kasim');
  assert.equal(srv.log.rpc.length, 1);
  assert.deepEqual(srv.log.rpc[0].args.p_new, { sell_price: 23000 });
  assert.deepEqual(srv.log.rpc[0].args.p_old, { sell_price: 21500 });
  assert.equal(srv.log.rpc[0].args.p_by, 'Kasim');
  await A.run("UPDATE products SET active = 0 WHERE id = 'p1'");
  await push(A, srv.client, () => 'Kasim');
  assert.deepEqual(srv.log.rpc[1].args.p_new, { active: false });

  // 5. Phone B downloads everything, and nothing of it is queued for upload.
  assert.equal(await pull(B, srv.client, 'admin1'), 'done');
  assert.equal(await count(B, 'orders'), 1);
  assert.equal(await count(B, 'order_items'), 1);
  assert.equal((await B.first<any>("SELECT sell_price FROM products WHERE id = 'p1'"))!.sell_price, 23000);
  assert.equal(await count(B, 'sync_outbox'), 0);

  // 6. A download never overwrites a change still waiting to upload on this phone.
  await B.run("UPDATE products SET name = 'Mullein tea (B)' WHERE id = 'p1'");
  srv.tables.products[0].name = 'Mullein (server)';
  srv.tables.products[0].updated_at = '2026-10-01T23:00:00+00:00';
  await pull(B, srv.client, 'admin1');
  assert.equal((await B.first<any>("SELECT name FROM products WHERE id = 'p1'"))!.name, 'Mullein tea (B)');
  await push(B, srv.client, () => 'B');
  await pull(B, srv.client, 'admin1');
  assert.equal(await count(B, 'sync_outbox'), 0);

  // 7. Deleting on one phone deletes on the other.
  await A.run("INSERT INTO day_openings (id, day, product_id, opening) VALUES ('d1', '2026-10-02', 'p1', 5)");
  await push(A, srv.client, () => 'Kasim');
  await pull(B, srv.client, 'admin1');
  assert.equal(await count(B, 'day_openings'), 1);
  await A.run("DELETE FROM day_openings WHERE id = 'd1'");
  await push(A, srv.client, () => 'Kasim');
  assert.equal(srv.tables.day_openings.length, 0);
  await pull(B, srv.client, 'admin1');
  assert.equal(await count(B, 'day_openings'), 0, 'the delete reached phone B');
  assert.equal(await count(B, 'sync_outbox'), 0);

  // 8. No signal: the changes stay in the list and nothing is lost.
  await A.run("UPDATE products SET low_at = 3 WHERE id = 'p1'");
  srv.log.failWith = { code: '', message: 'TypeError: Network request failed' };
  assert.equal(await push(A, srv.client, () => 'Kasim'), 'offline');
  assert.equal(await count(A, 'sync_outbox'), 1);
  assert.equal(await pull(A, srv.client, 'admin1'), 'offline');
  srv.log.failWith = null;
  assert.equal(await push(A, srv.client, () => 'Kasim'), 'done');
  assert.equal(srv.tables.products[0].low_at, 3);

  // 9. A change the server refuses for good is dropped, so the list does not get stuck.
  await A.run("UPDATE products SET low_at = 4 WHERE id = 'p1'");
  srv.log.failWith = { code: '42501', message: 'not allowed' };
  assert.equal(await push(A, srv.client, () => 'Kasim'), 'done');
  assert.equal(await count(A, 'sync_outbox'), 0);
  srv.log.failWith = null;

  // 10. A rider's phone never asks for cost prices, and never asks for sync clashes.
  srv.tables.profiles.push({ id: 'rider1', name: 'Ibrahim', role: 'rider', rider_id: 'r1', staff_id: null, can_sign_in: true, updated_at: '2026-10-01T00:00:02+00:00' });
  const R = phone();
  srv.log.selects = {};
  await pull(R, srv.client, 'rider1');
  assert.ok(!srv.log.selects.products.includes('cost_price'), 'riders do not download cost prices');
  assert.ok(srv.log.selects.products.includes('sell_price'));
  assert.equal(srv.log.selects.sync_clashes, undefined, 'only Admin downloads clashes');
  assert.ok(await pull(A, srv.client, 'admin1'));
  assert.ok(srv.log.selects.sync_clashes, 'Admin downloads clashes');

  console.log('All sync checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
