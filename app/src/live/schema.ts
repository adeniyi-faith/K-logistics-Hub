// The copy of the data kept on the phone, and the rules that note down every change
// made on the phone so it can be uploaded later. No native code in here, so it is
// easy to test. Columns must match supabase/migrations (the "id" column is added for every table).

export type ColKind = 'text' | 'integer' | 'json';
export type TableDef = {
  cols: Record<string, ColKind>;
  /** Edited by several people: the server checks for sync clashes (save_change in the migrations). */
  clash?: boolean;
};

export const TABLES: Record<string, TableDef> = {
  business: {
    clash: true,
    cols: {
      name: 'text',
      current_day: 'text',
      require_photo: 'integer',
      // The rest of the business settings, as JSON text (see data/settings.ts).
      settings: 'text',
    },
  },
  riders: {
    clash: true,
    cols: {
      name: 'text',
      initials: 'text',
      phone: 'text',
      bike: 'text',
      rate_per_delivery: 'integer',
      status: 'text',
      status_since: 'text',
      address: 'text',
      bike_model: 'text',
      bike_colour: 'text',
      id_type: 'text',
      id_number: 'text',
      joined: 'text',
      phone2: 'text',
      kin_name: 'text',
      kin_phone: 'text',
      kin_relation: 'text',
      pay_bank: 'text',
      pay_account: 'text',
      pay_name: 'text',
      documents: 'text',
      pay_changed: 'text',
      photo_path: 'text',
      change_request: 'text',
      change_request_at: 'text',
    },
  },
  staff: {
    clash: true,
    cols: {
      name: 'text',
      initials: 'text',
      job: 'text',
      phone: 'text',
      pay: 'integer',
      pay_every: 'text',
      active: 'integer',
      role_id: 'text',
      overrides: 'text',
      // The role plus this person's changes, worked out on save so the server can check it.
      access: 'text',
    },
  },
  profiles: {
    cols: { name: 'text', role: 'text', rider_id: 'text', staff_id: 'text', can_sign_in: 'integer' },
  },
  // Access is kept as JSON text (see data/access.ts).
  staff_roles: { clash: true, cols: { name: 'text', summary: 'text', access: 'text' } },
  products: {
    clash: true,
    cols: {
      name: 'text',
      product_group: 'text',
      unit: 'text',
      pack: 'text',
      cost_price: 'integer',
      sell_price: 'integer',
      low_at: 'integer',
      nafdac: 'text',
      supplier: 'text',
      active: 'integer',
    },
  },
  customers: {
    clash: true,
    cols: { name: 'text', phone: 'text', area: 'text', address: 'text', created_at: 'text' },
  },
  day_openings: { cols: { day: 'text', product_id: 'text', opening: 'integer' } },
  orders: {
    cols: {
      code: 'text',
      day: 'text',
      created_at: 'text',
      taken_by: 'text',
      customer_id: 'text',
      customer: 'text',
      phone: 'text',
      area: 'text',
      address: 'text',
      rider_id: 'text',
      payment: 'text',
      status: 'text',
      delivered_at: 'text',
      delivered_day: 'text',
      received_by: 'text',
      collected_method: 'text',
      collected_amount: 'integer',
      fail_reason: 'text',
      photo_path: 'text',
    },
  },
  order_items: {
    cols: { order_id: 'text', rider_id: 'text', product_id: 'text', qty: 'integer', unit_price: 'integer' },
  },
  stock_moves: {
    cols: {
      day: 'text',
      product_id: 'text',
      kind: 'text',
      qty: 'integer',
      at: 'text',
      by_name: 'text',
      batch: 'text',
      expiry: 'text',
      cost_price: 'integer',
      order_id: 'text',
      note: 'text',
    },
  },
  expenses: {
    cols: {
      day: 'text',
      category: 'text',
      note: 'text',
      amount: 'integer',
      frequency: 'text',
      bike: 'text',
      at: 'text',
      by_name: 'text',
      payee: 'text',
      receipt_path: 'text',
    },
  },
  // Values that clashed, for Admin to pick from. mine and theirs are JSON (text on the phone).
  sync_clashes: {
    cols: {
      table_name: 'text',
      row_id: 'text',
      field: 'text',
      mine: 'json',
      mine_by: 'text',
      theirs: 'json',
      at: 'text',
      resolved: 'integer',
    },
  },
};

export const TABLE_NAMES = Object.keys(TABLES);

/** Columns kept as true/false on the server but 1/0 on the phone. */
export const YES_NO = ['require_photo', 'active', 'can_sign_in', 'resolved'];

/** Bump when a table above changes. The phone's copy is then rebuilt from the server. */
export const SCHEMA_VERSION = 3;

/** A random id in the usual uuid shape, made inside SQLite. */
const UUID_SQL =
  "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || " +
  "substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))";

/** SQLite has no uuid() of its own; the app's SQL uses it, so swap it for the expression above. */
export const fixSql = (sql: string) => sql.replace(/\buuid\(\)/g, UUID_SQL);

const APPLYING = "(SELECT value FROM sync_meta WHERE key = 'applying') = '0'";

function rowJson(prefix: 'NEW' | 'OLD', cols: string[]) {
  return `json_object('id', ${prefix}.id, ${cols.map((c) => `'${c}', ${prefix}.${c}`).join(', ')})`;
}

/**
 * Everything to run once when the database is opened. Besides each table there is
 * sync_outbox, the list of changes waiting to be uploaded. Triggers add to it whenever
 * the app changes a row, unless the change is one being downloaded (the "applying" switch).
 */
export function setupSql(): string[] {
  const out = [
    'CREATE TABLE IF NOT EXISTS sync_outbox (seq INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, op TEXT NOT NULL, row_id TEXT NOT NULL, data TEXT, prev TEXT)',
    'CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)',
    "INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('applying', '0')",
    // Changes the server refused, so Admin can see what did not go through.
    'CREATE TABLE IF NOT EXISTS sync_refused (seq INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, op TEXT NOT NULL, row_id TEXT NOT NULL, at TEXT NOT NULL, reason TEXT)',
  ];
  for (const [name, def] of Object.entries(TABLES)) {
    const cols = Object.keys(def.cols);
    out.push(
      `CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, ${cols.map((c) => `${c} ${def.cols[c] === 'integer' ? 'INTEGER' : 'TEXT'}`).join(', ')})`,
      `DROP TRIGGER IF EXISTS sync_ins_${name}`,
      `DROP TRIGGER IF EXISTS sync_upd_${name}`,
      `DROP TRIGGER IF EXISTS sync_del_${name}`,
      `CREATE TRIGGER sync_ins_${name} AFTER INSERT ON ${name} WHEN ${APPLYING} BEGIN
         INSERT INTO sync_outbox (tbl, op, row_id, data) VALUES ('${name}', 'PUT', NEW.id, ${rowJson('NEW', cols)});
       END`,
      `CREATE TRIGGER sync_upd_${name} AFTER UPDATE ON ${name} WHEN ${APPLYING} BEGIN
         INSERT INTO sync_outbox (tbl, op, row_id, data, prev) VALUES ('${name}', 'PATCH', NEW.id, ${rowJson('NEW', cols)}, ${rowJson('OLD', cols)});
       END`,
      `CREATE TRIGGER sync_del_${name} AFTER DELETE ON ${name} WHEN ${APPLYING} BEGIN
         INSERT INTO sync_outbox (tbl, op, row_id) VALUES ('${name}', 'DELETE', OLD.id);
       END`,
    );
  }
  return out;
}

/** Statements that throw away the downloaded copy (keeping what is still waiting to upload). */
export function resetSql(): string[] {
  return [...TABLE_NAMES.map((t) => `DROP TABLE IF EXISTS ${t}`), "DELETE FROM sync_meta WHERE key LIKE 'cursor:%'"];
}
