// The real app on Android and iPhone.
// - Supabase: accounts (sign-in) and the online database.
// - PowerSync: keeps a copy of the data in a database on the phone, uploads changes
//   made on the phone, and downloads changes made on other phones. Everything the app
//   shows is read from the phone's copy, so it keeps working with no internet.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AbstractPowerSyncDatabase,
  column,
  PowerSyncBackendConnector,
  PowerSyncDatabase,
  Schema,
  SyncStatus,
  Table,
  UpdateType,
} from '@powersync/react-native';
import { createClient, Session } from '@supabase/supabase-js';

import { DEFAULT_ROLES, parseJson, withOverrides } from '../data/access';
import { DEFAULT_SETTINGS, withDefaults } from '../data/settings';
import { AppState, Clash, Customer, Order, PendingChange, Product, Rider, Role, Settings, Staff, StockMove } from '../data/types';
import { uuid } from '../lib/id';
import { nextOrderCode } from '../lib/sales';
import { closingStock, nextDay } from '../lib/stock';
import { initialsOf, today } from '../lib/format';
import { config } from './config';
import { connectAssistant } from './assistant';
import { keepPhoto, localPhoto, uploadWaitingPhotos, BUCKET } from './photos';
import { LiveEngine, LiveSnapshot, SyncInfo } from './types';

// ------------------------------------------------------------------ schema
// Must match supabase/migrations (PowerSync adds the "id" column itself).

// Records people edit (rather than add) keep the value from before each change, so the
// server can tell when two phones changed the same thing (a "sync clash").
const CLASH_CHECKED = { trackPrevious: { onlyWhenChanged: true } };

const schema = new Schema({
  business: new Table(
    {
      name: column.text,
      current_day: column.text,
      require_photo: column.integer,
      // The rest of the business settings, as JSON text (see data/settings.ts).
      settings: column.text,
    },
    CLASH_CHECKED,
  ),
  riders: new Table(
    {
      name: column.text,
      initials: column.text,
      phone: column.text,
      bike: column.text,
      rate_per_delivery: column.integer,
      status: column.text,
      status_since: column.text,
      address: column.text,
      bike_model: column.text,
      bike_colour: column.text,
      id_type: column.text,
      id_number: column.text,
      joined: column.text,
      phone2: column.text,
      kin_name: column.text,
      kin_phone: column.text,
      kin_relation: column.text,
      pay_bank: column.text,
      pay_account: column.text,
      pay_name: column.text,
      pay_changed: column.text,
      photo_path: column.text,
      change_request: column.text,
      change_request_at: column.text,
    },
    CLASH_CHECKED,
  ),
  staff: new Table(
    {
      name: column.text,
      initials: column.text,
      job: column.text,
      phone: column.text,
      pay: column.integer,
      pay_every: column.text,
      active: column.integer,
      role_id: column.text,
      overrides: column.text,
      // The role plus this person's changes, worked out on save so the server can check it.
      access: column.text,
    },
    CLASH_CHECKED,
  ),
  profiles: new Table({
    name: column.text,
    role: column.text,
    rider_id: column.text,
    staff_id: column.text,
    can_sign_in: column.integer,
  }),
  // Access is kept as JSON text (see data/access.ts).
  staff_roles: new Table({ name: column.text, summary: column.text, access: column.text }, CLASH_CHECKED),
  products: new Table(
    {
      name: column.text,
      product_group: column.text,
      unit: column.text,
      pack: column.text,
      cost_price: column.integer,
      sell_price: column.integer,
      low_at: column.integer,
      nafdac: column.text,
      supplier: column.text,
      active: column.integer,
    },
    CLASH_CHECKED,
  ),
  customers: new Table(
    {
      name: column.text,
      phone: column.text,
      area: column.text,
      address: column.text,
      created_at: column.text,
    },
    CLASH_CHECKED,
  ),
  day_openings: new Table({ day: column.text, product_id: column.text, opening: column.integer }),
  orders: new Table({
    code: column.text,
    day: column.text,
    created_at: column.text,
    taken_by: column.text,
    customer_id: column.text,
    customer: column.text,
    phone: column.text,
    area: column.text,
    address: column.text,
    rider_id: column.text,
    payment: column.text,
    status: column.text,
    delivered_at: column.text,
    delivered_day: column.text,
    received_by: column.text,
    collected_method: column.text,
    collected_amount: column.integer,
    fail_reason: column.text,
    photo_path: column.text,
  }),
  order_items: new Table({
    order_id: column.text,
    rider_id: column.text,
    product_id: column.text,
    qty: column.integer,
    unit_price: column.integer,
  }),
  stock_moves: new Table({
    day: column.text,
    product_id: column.text,
    kind: column.text,
    qty: column.integer,
    at: column.text,
    by_name: column.text,
    batch: column.text,
    expiry: column.text,
    cost_price: column.integer,
    order_id: column.text,
  }),
  expenses: new Table({
    day: column.text,
    category: column.text,
    note: column.text,
    amount: column.integer,
    frequency: column.text,
    bike: column.text,
    at: column.text,
    by_name: column.text,
    payee: column.text,
    receipt_path: column.text,
  }),
  // Values that clashed, for Admin to pick from. mine and theirs are JSON text.
  sync_clashes: new Table({
    table_name: column.text,
    row_id: column.text,
    field: column.text,
    mine: column.text,
    mine_by: column.text,
    theirs: column.text,
    at: column.text,
    resolved: column.integer,
  }),
});

/** Tables whose changes go through the server's clash check (save_change in the migrations). */
const CLASH_TABLES = ['business', 'riders', 'staff', 'staff_roles', 'products', 'customers'];
/** Columns kept as true/false on the server but 1/0 on the phone. */
const YES_NO = ['require_photo', 'active'];

const TABLES = Object.keys(schema.props);

const LABELS: Record<string, string> = {
  stock_moves: 'Stock change',
  orders: 'Order',
  customers: 'Customer',
  products: 'Product change',
  expenses: 'Expense',
  riders: 'Rider',
  staff: 'Staff',
  staff_roles: 'Staff role',
  profiles: 'Sign-in',
  order_items: 'Order item',
  day_openings: 'Opening stock',
  business: 'Business settings',
  sync_clashes: 'Sync clash choice',
};

// Postgres error codes that will never succeed on retry (bad data, or not allowed).
const FATAL = [/^22...$/, /^23...$/, /^42501$/];

type Row = Record<string, any>;

export function createLiveEngine(): LiveEngine {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  connectAssistant(supabase);

  const connector: PowerSyncBackendConnector = {
    fetchCredentials: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      return { endpoint: config.powersyncUrl, token: data.session.access_token };
    },
    // Sends the changes saved on this phone to Supabase, oldest first.
    uploadData: async (database: AbstractPowerSyncDatabase) => {
      const tx = await database.getNextCrudTransaction();
      if (!tx) return;
      try {
        for (const op of tx.crud) {
          const table = supabase.from(op.table);
          const result =
            op.op === UpdateType.PATCH && CLASH_TABLES.includes(op.table) && op.previousValues
              ? // The server saves what nobody else changed meanwhile, and records a clash for the rest.
                await supabase.rpc('save_change', {
                  p_table: op.table,
                  p_id: op.id,
                  p_new: op.opData ?? {},
                  p_old: op.previousValues,
                  p_by: snap.state.session?.name ?? '',
                })
              : op.op === UpdateType.PUT
                ? await table.upsert({ ...op.opData, id: op.id })
                : op.op === UpdateType.PATCH
                  ? await table.update(op.opData ?? {}).eq('id', op.id)
                  : await table.delete().eq('id', op.id);
          if (result.error) throw result.error;
        }
        await tx.complete();
      } catch (e: any) {
        if (typeof e?.code === 'string' && FATAL.some((r) => r.test(e.code))) {
          // The server refused this change for good (e.g. not allowed). Drop it so the
          // queue does not get stuck; the next download puts the phone back in line.
          console.warn('Change refused by the server and discarded', e);
          await tx.complete();
          return;
        }
        throw e; // No internet or a temporary error: PowerSync tries again shortly.
      }
    },
  };

  const db = new PowerSyncDatabase({ schema, database: { dbFilename: 'k-logistics.db' } });

  let session: Session | null = null;
  let snap: LiveSnapshot = { phase: 'signedOut', state: emptyState(), sync: { status: 'offline', waiting: 0 } };
  const listeners = new Set<(s: LiveSnapshot) => void>();
  const emit = (next: LiveSnapshot) => {
    snap = next;
    listeners.forEach((l) => l(snap));
  };

  let loading = false;
  let again = false;
  async function reload() {
    if (loading) {
      again = true;
      return;
    }
    loading = true;
    try {
      do {
        again = false;
        emit(await readSnapshot(db, session));
      } while (again);
    } catch (e) {
      console.warn('Could not read the phone database', e);
    } finally {
      loading = false;
    }
  }

  db.onChange({ onChange: () => reload() }, { tables: TABLES, throttleMs: 150 });
  db.registerListener({
    statusChanged: (status) => {
      reload();
      // Back online: send any delivery photos taken while offline.
      if (status.connected && session) uploadWaitingPhotos(supabase).catch(() => {});
    },
  });

  async function start(next: Session | null) {
    const before = session?.user.id;
    session = next;
    if (next && next.user.id !== before) {
      await db.connect(connector);
    } else if (!next && before) {
      // Signed out: forget this person's data on the phone.
      await db.disconnectAndClear();
    }
    await reload();
  }

  supabase.auth.getSession().then(({ data }) => start(data.session));
  supabase.auth.onAuthStateChange((_event, next) => {
    if (next?.user.id !== session?.user.id) start(next);
    else session = next;
  });

  const by = () => snap.state.session?.name ?? '';
  const now = () => new Date().toISOString();
  /** Changes only the columns given a value. */
  const updateRow = async (table: string, id: string, cols: Record<string, unknown>) => {
    const set = Object.entries(cols).filter(([, v]) => v !== undefined);
    if (!set.length) return;
    await db.execute(`UPDATE ${table} SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, [
      ...set.map(([, v]) => v),
      id,
    ]);
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(snap);
      return () => listeners.delete(listener);
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? 'Wrong email or password, or no internet. Please try again.' : null;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async receiveStock({ productId, qty, costPrice, batch, expiry }) {
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO stock_moves (id, day, product_id, kind, qty, at, by_name, batch, expiry, cost_price)
           VALUES (uuid(), ?, ?, 'received', ?, ?, ?, ?, ?, ?)`,
          [snap.state.day, productId, qty, now(), by(), batch || null, expiry || null, costPrice],
        );
        await tx.execute('UPDATE products SET cost_price = ? WHERE id = ?', [costPrice, productId]);
      });
    },
    async confirmDelivery({ orderId, receivedBy, method, amount, photo }) {
      const order = snap.state.orders.find((o) => o.id === orderId);
      if (!order || order.status !== 'pending') return;
      const at = now();
      // Keep the photo on the phone first; it uploads by itself when there's internet.
      const photoName = photo ? await keepPhoto(orderId, photo) : null;
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `UPDATE orders SET status = 'delivered', delivered_at = ?, delivered_day = ?, received_by = ?, collected_method = ?,
           collected_amount = ?, photo_path = ? WHERE id = ?`,
          [at, snap.state.day, receivedBy, method, amount, photoName, orderId],
        );
        // Delivered goods leave the store, so stock goes down by itself.
        for (const it of order.items) {
          await tx.execute(
            `INSERT INTO stock_moves (id, day, product_id, kind, qty, at, by_name, order_id)
             VALUES (uuid(), ?, ?, 'delivered', ?, ?, ?, ?)`,
            [snap.state.day, it.productId, it.qty, at, by(), orderId],
          );
        }
      });
      if (photoName) uploadWaitingPhotos(supabase).catch(() => {});
    },
    async updateSettings(settings) {
      let logo = settings.logo;
      // A new logo is a photo on this phone: keep it, and upload it when there's internet.
      if (logo && logo !== snap.state.settings.logo) logo = await keepPhoto(`logo-${uuid()}`, logo);
      const { requirePhoto, ...rest } = { ...settings, logo };
      await db.execute('UPDATE business SET require_photo = ?, name = ?, settings = ?', [
        requirePhoto ? 1 : 0,
        settings.businessName,
        JSON.stringify(rest),
      ]);
      if (logo !== snap.state.settings.logo) uploadWaitingPhotos(supabase).catch(() => {});
    },
    async addProduct(p) {
      const id = uuid();
      await db.execute(
        `INSERT INTO products (id, name, product_group, unit, pack, cost_price, sell_price, low_at, nafdac, supplier, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, p.name, p.group, p.unit, p.pack, p.costPrice, p.sellPrice, p.lowAt, p.nafdac, p.supplier],
      );
      return id;
    },
    async updateProduct(id, p) {
      await updateRow('products', id, {
        name: p.name,
        product_group: p.group,
        unit: p.unit,
        pack: p.pack,
        cost_price: p.costPrice,
        sell_price: p.sellPrice,
        low_at: p.lowAt,
        nafdac: p.nafdac,
        supplier: p.supplier,
      });
    },
    async changePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      return error ? 'The password could not be changed. You need internet for this; please try again.' : null;
    },
    async resolveClash(id, keep) {
      const c = snap.state.clashes.find((x) => x.id === id);
      if (!c) return;
      // Only ever write to a real column of a table that can clash.
      const known = schema.tables.find((t) => t.name === c.table)?.columns.some((col) => col.name === c.field);
      await db.writeTransaction(async (tx) => {
        if (keep === 'mine' && CLASH_TABLES.includes(c.table) && known) {
          const v = YES_NO.includes(c.field) ? (c.mine ? 1 : 0) : c.mine;
          await tx.execute(`UPDATE ${c.table} SET ${c.field} = ? WHERE id = ?`, [v ?? null, c.rowId]);
        }
        await tx.execute('UPDATE sync_clashes SET resolved = 1 WHERE id = ?', [id]);
      });
    },
    async addExpense({ day, category, note, amount, frequency, bike, payee, receipt }) {
      const id = uuid();
      // Keep the receipt photo on the phone first; it uploads by itself when there's internet.
      const receiptName = receipt ? await keepPhoto(id, receipt) : null;
      await db.execute(
        `INSERT INTO expenses (id, day, category, note, amount, frequency, bike, at, by_name, payee, receipt_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, day, category, note, amount, frequency, bike ?? null, now(), by(), payee ?? null, receiptName],
      );
      if (receiptName) uploadWaitingPhotos(supabase).catch(() => {});
    },
    async addRider(input) {
      const id = uuid();
      const r = { ...input, initials: initialsOf(input.name) };
      await db.execute(
        `INSERT INTO riders (id, name, initials, phone, bike, rate_per_delivery, status, status_since, address, bike_model,
         bike_colour, id_type, id_number, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          r.name,
          r.initials,
          r.phone,
          r.bike,
          r.ratePerDelivery,
          r.status,
          r.statusSince ?? null,
          r.address ?? null,
          r.bikeModel ?? null,
          r.bikeColour ?? null,
          r.idType ?? null,
          r.idNumber ?? null,
          r.joined ?? null,
        ],
      );
      return id;
    },
    async updateRider(id, changes) {
      const before = snap.state.riders.find((r) => r.id === id);
      // A new photo is a file on this phone: keep it, and upload it when there's internet.
      const photo =
        changes.photo && changes.photo !== before?.photo ? await keepPhoto(`rider-${uuid()}`, changes.photo) : undefined;
      const cols: Record<string, unknown> = {
        name: changes.name,
        initials: changes.name ? initialsOf(changes.name) : undefined,
        phone: changes.phone,
        bike: changes.bike,
        rate_per_delivery: changes.ratePerDelivery,
        status: changes.status,
        status_since: changes.statusSince,
        address: changes.address,
        bike_model: changes.bikeModel,
        bike_colour: changes.bikeColour,
        id_type: changes.idType,
        id_number: changes.idNumber,
        phone2: changes.phone2,
        kin_name: changes.kinName,
        kin_phone: changes.kinPhone,
        kin_relation: changes.kinRelation,
        pay_bank: changes.payBank,
        pay_account: changes.payAccount,
        pay_name: changes.payName,
        pay_changed: changes.payChanged,
        photo_path: photo,
        change_request: changes.changeRequest,
        change_request_at: changes.changeRequestAt,
      };
      await updateRow('riders', id, cols);
      if (photo) uploadWaitingPhotos(supabase).catch(() => {});
    },
    async addStaff(input) {
      const role = snap.state.roles.find((r) => r.id === input.roleId);
      await db.execute(
        `INSERT INTO staff (id, name, initials, job, phone, pay, pay_every, active, role_id, overrides, access)
         VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, '{}', ?)`,
        [
          input.name,
          initialsOf(input.name),
          input.job,
          input.phone,
          input.pay,
          input.payEvery,
          input.active ? 1 : 0,
          input.roleId ?? null,
          role ? JSON.stringify(role.access) : null,
        ],
      );
    },
    async updateStaff(id, changes) {
      await updateRow('staff', id, {
        name: changes.name,
        initials: changes.name ? initialsOf(changes.name) : undefined,
        job: changes.job,
        phone: changes.phone,
        pay: changes.pay,
        pay_every: changes.payEvery,
        active: changes.active === undefined ? undefined : changes.active ? 1 : 0,
      });
    },
    async saveStaffAccess(staffId, { job, roleId, overrides, canSignIn }) {
      const role = snap.state.roles.find((r) => r.id === roleId);
      const access = role ? JSON.stringify(withOverrides(role.access, overrides)) : null;
      await db.writeTransaction(async (tx) => {
        await tx.execute('UPDATE staff SET job = ?, role_id = ?, overrides = ?, access = ? WHERE id = ?', [
          job,
          roleId,
          JSON.stringify(overrides),
          access,
          staffId,
        ]);
        await tx.execute('UPDATE profiles SET can_sign_in = ? WHERE staff_id = ?', [canSignIn ? 1 : 0, staffId]);
      });
    },
    async saveRole(role) {
      await db.writeTransaction(async (tx) => {
        const exists = await tx.getOptional('SELECT id FROM staff_roles WHERE id = ?', [role.id]);
        const text = JSON.stringify(role.access);
        if (exists) {
          await tx.execute('UPDATE staff_roles SET name = ?, summary = ?, access = ? WHERE id = ?', [
            role.name,
            role.summary,
            text,
            role.id,
          ]);
        } else {
          await tx.execute('INSERT INTO staff_roles (id, name, summary, access) VALUES (?, ?, ?, ?)', [
            role.id,
            role.name,
            role.summary,
            text,
          ]);
        }
        // Everyone with this role gets the change, except what was changed just for them.
        for (const x of snap.state.staff.filter((x) => x.roleId === role.id)) {
          await tx.execute('UPDATE staff SET access = ? WHERE id = ?', [
            JSON.stringify(withOverrides(role.access, x.overrides)),
            x.id,
          ]);
        }
      });
    },
    async photoUrl(photo) {
      const local = localPhoto(photo);
      if (local) return local;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo, 60 * 60);
      return data?.signedUrl ?? null;
    },
    async createSale(input) {
      const id = uuid();
      const s = snap.state;
      const at = now();
      await db.writeTransaction(async (tx) => {
        let customerId = input.customerId;
        let name = '';
        let phone = '';
        if (customerId) {
          const c = s.customers.find((x) => x.id === customerId);
          name = c?.name ?? '';
          phone = c?.phone ?? '';
        } else {
          customerId = uuid();
          name = input.newCustomer?.name ?? '';
          phone = input.newCustomer?.phone ?? '';
          await tx.execute('INSERT INTO customers (id, name, phone, area, address, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
            customerId,
            name,
            phone,
            input.area,
            input.address,
            at,
          ]);
        }
        await tx.execute(
          `INSERT INTO orders (id, code, day, created_at, taken_by, customer_id, customer, phone, area, address, rider_id, payment, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            id,
            nextOrderCode(s),
            s.day,
            at,
            by(),
            customerId,
            name,
            phone,
            input.area,
            input.address,
            input.riderId,
            input.payment,
          ],
        );
        for (const it of input.items) {
          await tx.execute(
            'INSERT INTO order_items (id, order_id, rider_id, product_id, qty, unit_price) VALUES (uuid(), ?, ?, ?, ?, ?)',
            [id, input.riderId, it.productId, it.qty, it.unitPrice],
          );
        }
      });
      return id;
    },
    async closeDay() {
      const s = snap.state;
      const next = nextDay(s.day);
      const closing = closingStock(s);
      await db.writeTransaction(async (tx) => {
        const business = await tx.getOptional<Row>('SELECT id, current_day FROM business LIMIT 1');
        if (!business || business.current_day !== s.day) return; // Already closed on this phone.
        // Replace anything already written for tomorrow, then copy tonight's closing stock in.
        await tx.execute('DELETE FROM day_openings WHERE day = ?', [next]);
        for (const [productId, opening] of Object.entries(closing)) {
          await tx.execute('INSERT INTO day_openings (id, day, product_id, opening) VALUES (uuid(), ?, ?, ?)', [
            next,
            productId,
            opening,
          ]);
        }
        await tx.execute('UPDATE business SET current_day = ? WHERE id = ?', [next, business.id]);
      });
    },
    async updatePrices({ productId, costPrice, sellPrice, lowAt }) {
      await db.execute('UPDATE products SET cost_price = ?, sell_price = ?, low_at = ? WHERE id = ?', [
        costPrice,
        sellPrice,
        lowAt,
        productId,
      ]);
    },
  };
}

// ------------------------------------------------------------ reading data

function emptyState(): AppState {
  return {
    version: 1,
    day: today(),
    session: null,
    settings: DEFAULT_SETTINGS,
    products: [],
    openings: {},
    moves: [],
    riders: [],
    staff: [],
    roles: DEFAULT_ROLES,
    customers: [],
    orders: [],
    expenses: [],
    clashes: [],
    pending: [],
  };
}

function syncInfo(status: SyncStatus, waiting: number): SyncInfo {
  if (!status.connected) return { status: 'offline', waiting };
  if (status.dataFlowStatus.uploading || status.dataFlowStatus.downloading || waiting > 0) return { status: 'syncing', waiting };
  return { status: 'synced', waiting };
}

async function readSnapshot(db: PowerSyncDatabase, session: Session | null): Promise<LiveSnapshot> {
  const crud = await db.getAll<{ id: number; data: string }>('SELECT id, data FROM ps_crud ORDER BY id');
  const pending: PendingChange[] = crud.map((c) => {
    const d = JSON.parse(c.data) as { type?: string; id?: string };
    return { id: String(c.id), at: '', label: LABELS[d.type ?? ''] ?? 'Change', ref: d.id ?? '' };
  });
  const sync = syncInfo(db.currentStatus, pending.length);
  const state = emptyState();
  state.pending = pending;

  if (!session) return { phase: 'signedOut', state, sync };

  const profile = (await db.getOptional<Row>('SELECT * FROM profiles WHERE id = ?', [session.user.id])) ?? null;
  if (!profile) return { phase: 'loading', state, sync };
  if (!profile.can_sign_in) return { phase: 'signedOut', state, sync };

  const business = await db.getOptional<Row>('SELECT current_day, require_photo, settings FROM business LIMIT 1');
  state.day = business?.current_day ?? today();
  state.settings = withDefaults({
    ...parseJson<Partial<Settings>>(business?.settings, {}),
    requirePhoto: Boolean(business?.require_photo),
  });
  state.session = {
    role: profile.role as Role,
    name: String(profile.name ?? '').split(' ')[0],
    riderId: profile.rider_id ?? undefined,
    staffId: profile.staff_id ?? undefined,
  };

  const [products, openings, moves, riders, customers, orders, items, expenses, staff, roles, logins, clashes] =
    await Promise.all([
      db.getAll<Row>('SELECT * FROM products WHERE active IS NULL OR active = 1 ORDER BY name'),
      db.getAll<Row>('SELECT day, product_id, opening FROM day_openings'),
      db.getAll<Row>('SELECT * FROM stock_moves'),
      db.getAll<Row>('SELECT * FROM riders ORDER BY name'),
      db.getAll<Row>('SELECT * FROM customers ORDER BY name'),
      db.getAll<Row>('SELECT * FROM orders ORDER BY created_at'),
      db.getAll<Row>('SELECT * FROM order_items'),
      db.getAll<Row>('SELECT * FROM expenses'),
      db.getAll<Row>('SELECT * FROM staff ORDER BY name'),
      db.getAll<Row>('SELECT * FROM staff_roles ORDER BY name'),
      db.getAll<Row>('SELECT staff_id, can_sign_in FROM profiles WHERE staff_id IS NOT NULL'),
      // Only Admin phones download these (see powersync/sync-rules.yaml).
      db.getAll<Row>('SELECT * FROM sync_clashes WHERE resolved IS NULL OR resolved = 0 ORDER BY at'),
    ]);

  state.products = products.map(
    (p): Product => ({
      id: p.id,
      name: p.name ?? '',
      group: p.product_group ?? '',
      unit: p.unit ?? 'unit',
      pack: p.pack ?? '',
      costPrice: p.cost_price ?? 0,
      sellPrice: p.sell_price ?? 0,
      lowAt: p.low_at ?? 0,
      nafdac: p.nafdac ?? '',
      supplier: p.supplier ?? '',
    }),
  );
  for (const o of openings) {
    (state.openings[o.day] ??= {})[o.product_id] = o.opening ?? 0;
  }
  state.moves = moves.map(
    (m): StockMove => ({
      id: m.id,
      day: m.day,
      productId: m.product_id,
      kind: m.kind,
      qty: m.qty ?? 0,
      at: m.at ?? '',
      by: m.by_name ?? '',
      batch: m.batch ?? undefined,
      expiry: m.expiry ?? undefined,
      costPrice: m.cost_price ?? undefined,
      orderId: m.order_id ?? undefined,
    }),
  );
  state.riders = riders.map(
    (r): Rider => ({
      id: r.id,
      name: r.name ?? '',
      initials: r.initials ?? '',
      phone: r.phone ?? '',
      bike: r.bike ?? '',
      ratePerDelivery: r.rate_per_delivery ?? 0,
      status: r.status ?? 'active',
      statusSince: r.status_since ?? undefined,
      address: r.address ?? undefined,
      bikeModel: r.bike_model ?? undefined,
      bikeColour: r.bike_colour ?? undefined,
      idType: r.id_type ?? undefined,
      idNumber: r.id_number ?? undefined,
      joined: r.joined ?? undefined,
      phone2: r.phone2 ?? undefined,
      kinName: r.kin_name ?? undefined,
      kinPhone: r.kin_phone ?? undefined,
      kinRelation: r.kin_relation ?? undefined,
      payBank: r.pay_bank ?? undefined,
      payAccount: r.pay_account ?? undefined,
      payName: r.pay_name ?? undefined,
      payChanged: r.pay_changed ?? undefined,
      photo: r.photo_path ?? undefined,
      changeRequest: r.change_request ?? undefined,
      changeRequestAt: r.change_request_at ?? undefined,
    }),
  );
  state.staff = staff.map(
    (x): Staff => ({
      id: x.id,
      name: x.name ?? '',
      initials: x.initials ?? '',
      job: x.job ?? '',
      phone: x.phone ?? '',
      pay: x.pay ?? 0,
      payEvery: x.pay_every === 'week' ? 'week' : 'month',
      active: x.active === null || x.active === undefined ? true : Boolean(x.active),
      roleId: x.role_id ?? undefined,
      overrides: parseJson(x.overrides, {}),
      canSignIn: (() => {
        const login = logins.find((l) => l.staff_id === x.id);
        return login ? Boolean(login.can_sign_in) : undefined;
      })(),
    }),
  );
  // The default roles are added by the database setup; fall back to them until they have downloaded.
  state.roles = roles.length
    ? roles.map((r) => ({
        id: r.id,
        name: r.name ?? '',
        summary: r.summary ?? '',
        access: parseJson(r.access, DEFAULT_ROLES[0].access),
      }))
    : DEFAULT_ROLES;
  state.customers = customers.map(
    (c): Customer => ({
      id: c.id,
      name: c.name ?? '',
      phone: c.phone ?? '',
      area: c.area ?? '',
      address: c.address ?? '',
      since: String(c.created_at ?? '').slice(0, 10),
    }),
  );
  const itemsByOrder = new Map<string, Order['items']>();
  for (const it of items) {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push({ productId: it.product_id, qty: it.qty ?? 0, unitPrice: it.unit_price ?? 0 });
    itemsByOrder.set(it.order_id, list);
  }
  state.orders = orders.map(
    (o): Order => ({
      id: o.id,
      code: o.code ?? '',
      day: o.day,
      createdAt: o.created_at ?? '',
      takenBy: o.taken_by ?? '',
      customerId: o.customer_id ?? '',
      customer: o.customer ?? '',
      phone: o.phone ?? '',
      area: o.area ?? '',
      address: o.address ?? '',
      riderId: o.rider_id ?? '',
      items: itemsByOrder.get(o.id) ?? [],
      payment: o.payment,
      status: o.status,
      deliveredAt: o.delivered_at ?? undefined,
      deliveredDay: o.delivered_day ?? undefined,
      receivedBy: o.received_by ?? undefined,
      collected: o.collected_method ? { method: o.collected_method, amount: o.collected_amount ?? 0 } : undefined,
      failReason: o.fail_reason ?? undefined,
      photo: o.photo_path ?? undefined,
    }),
  );
  state.expenses = expenses.map((e) => ({
    id: e.id,
    day: e.day,
    category: e.category ?? '',
    note: e.note ?? '',
    amount: e.amount ?? 0,
    frequency: e.frequency ?? 'one_time',
    bike: e.bike ?? undefined,
    at: e.at ?? '',
    by: e.by_name ?? '',
    payee: e.payee ?? undefined,
    receipt: e.receipt_path ?? undefined,
  }));
  state.clashes = clashes.map(
    (c): Clash => ({
      id: c.id,
      table: c.table_name ?? '',
      rowId: c.row_id ?? '',
      field: c.field ?? '',
      mine: parseJson<unknown>(c.mine, null),
      mineBy: c.mine_by ?? '',
      theirs: parseJson<unknown>(c.theirs, null),
      at: c.at ?? '',
    }),
  );

  return { phase: 'ready', state, sync };
}
