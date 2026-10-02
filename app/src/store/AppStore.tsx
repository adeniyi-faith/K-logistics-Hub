// The app's memory, shared by every screen.
//
// Two ways to run:
// - Live (Android/iPhone with Supabase set up in .env.local): real accounts,
//   data kept on the phone and synced with the online database. See src/live.
// - Demo (no setup, or the browser): sample data saved only on this phone. Every change
//   goes on a "waiting to upload" list so the sync badge behaves like the real thing.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { sampleState } from '../data/sample';
import { StaffRole } from '../data/access';
import { AppState, Role, Settings } from '../data/types';
import { initialsOf, naira, today } from '../lib/format';
import { liveAvailable } from '../live/config';
import { removeLogin } from '../live/logins';
import { createLiveEngine } from '../live/engine';
import {
  AccessInput,
  ClashChoice,
  ClearPart,
  ConfirmInput,
  ExpenseInput,
  LiveEngine,
  LiveSnapshot,
  Phase,
  PriceInput,
  ProductInput,
  ReceiveInput,
  RiderInput,
  SaleInput,
  StaffInput,
  SyncInfo,
} from '../live/types';
import { uuid } from '../lib/id';
import { nextOrderCode } from '../lib/sales';
import { closingStock, nextDay } from '../lib/stock';

const KEY = 'klh-state-v9';

export type Store = {
  mode: 'demo' | 'live';
  phase: Phase;
  state: AppState;
  sync: SyncInfo;
  /** Demo only: open the app as one of the sample people. */
  signInAs: (role: Role) => void;
  /** Live only: returns an error message, or null when signed in. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  receiveStock: (input: ReceiveInput) => void;
  confirmDelivery: (input: ConfirmInput) => void;
  updatePrices: (input: PriceInput) => void;
  /** Saves a new sale and returns its id. */
  createSale: (input: SaleInput) => Promise<string>;
  /** Closing stock becomes tomorrow's opening stock, and the app moves to tomorrow. */
  closeDay: () => void;
  /** Admin: business settings such as the logo, lists, words and the delivery photo switch. */
  updateSettings: (settings: Settings) => void;
  /** Saves a new product and returns its id. */
  addProduct: (input: ProductInput) => Promise<string>;
  updateProduct: (id: string, changes: Partial<ProductInput>) => void;
  /** Admin and Staff: write down money spent. */
  addExpense: (input: ExpenseInput) => void;
  /** Admin: saves a new rider and returns their id. */
  addRider: (input: RiderInput) => Promise<string>;
  /** Admin, or a rider changing their own details. */
  updateRider: (id: string, changes: Partial<RiderInput>) => void;
  /** Needs internet in live mode. Returns an error message, or null when done. */
  changePassword: (password: string) => Promise<string | null>;
  /** Admin: keep one of the two values after a sync clash. */
  resolveClash: (id: string, keep: ClashChoice) => void;
  /** Saves a new staff member and returns their id. */
  addStaff: (input: StaffInput) => Promise<string>;
  updateStaff: (id: string, changes: Partial<StaffInput>) => void;
  /** Admin: give a staff member a role and any changes just for them. */
  saveStaffAccess: (staffId: string, input: AccessInput) => void;
  /** Admin: add or change a staff role. Everyone with the role gets the change. */
  saveRole: (role: StaffRole) => void;
  /** Something the app can show for a delivery photo, or null when it can't be loaded now. */
  photoUrl: (photo: string) => Promise<string | null>;
  /** Demo only: put the sample data back the way it started. */
  resetDemo: () => void;
  /** Sends what is waiting now (needs internet). True once the given record has reached the server. */
  uploadNow: (rowId?: string) => Promise<boolean>;
  /** Admin: removes a sale and any stock it took out (the stock goes back). */
  deleteSale: (orderId: string) => void;
  deleteExpense: (id: string) => void;
  /** Admin: removes one "received" stock entry. */
  deleteStockMove: (id: string) => void;
  /** Admin: removes a customer; their past sales keep the name copied onto them. */
  deleteCustomer: (id: string) => void;
  /** Admin: hides a product that is in past sales, or removes any other product with its stock records. */
  removeProduct: (id: string) => void;
  /** Admin: removes a rider or staff member and their sign-in. Returns an error message, or null when done. */
  deleteRider: (id: string) => Promise<string | null>;
  deleteStaff: (id: string) => Promise<string | null>;
  /** Admin: wipes whole kinds of records, e.g. the sample data the business started with. */
  clearData: (parts: ClearPart[]) => Promise<void>;
  /** Admin: who the app is shown as right now (see "See the app as"), or null for Admin's own view. */
  viewAs: ViewAs | null;
  setViewAs: (v: ViewAs | null) => void;
};

/** Admin looking at the app the way one staff member or rider sees it. */
export type ViewAs = { role: 'staff' | 'rider'; id: string };

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return liveAvailable ? <LiveProvider>{children}</LiveProvider> : <DemoProvider>{children}</DemoProvider>;
}

type BaseStore = Omit<Store, 'viewAs' | 'setViewAs'>;

/** Removes the person's sign-in first, so nobody is left with an account that points at nothing. */
async function withoutLogin(kind: 'staff' | 'rider', id: string, remove: () => unknown) {
  const r = await removeLogin(kind, id);
  if (r.error) return r.error;
  await remove();
  return null;
}

/**
 * Lets Admin see the app as one staff member or rider. Only what the screens are told about
 * the signed-in person changes; everything is still saved as Admin.
 */
function ViewAsLayer({ base, children }: { base: BaseStore; children: ReactNode }) {
  const [viewAs, setViewAs] = useState<ViewAs | null>(null);
  const real = base.state.session;
  const store = useMemo<Store>(() => {
    const person =
      real?.role === 'admin' && viewAs
        ? viewAs.role === 'staff'
          ? base.state.staff.find((x) => x.id === viewAs.id)
          : base.state.riders.find((x) => x.id === viewAs.id)
        : undefined;
    const signOut = () => {
      setViewAs(null);
      base.signOut();
    };
    if (!viewAs || !person) return { ...base, signOut, viewAs: null, setViewAs };
    const name = person.name.split(' ')[0];
    const session =
      viewAs.role === 'staff'
        ? { role: 'staff' as const, name, staffId: person.id, viewing: true }
        : { role: 'rider' as const, name, riderId: person.id, viewing: true };
    return { ...base, signOut, state: { ...base.state, session }, viewAs, setViewAs };
  }, [base, viewAs, real]);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}

// ------------------------------------------------------------------- live

let engine: LiveEngine | null = null;

function LiveProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);

  useEffect(() => {
    engine ??= createLiveEngine();
    return engine.subscribe(setSnap);
  }, []);

  const store = useMemo<BaseStore | null>(() => {
    if (!snap || !engine) return null;
    const e = engine;
    const report = (p: Promise<unknown>) => p.catch((err) => console.warn('Could not save on the phone', err));
    return {
      mode: 'live',
      phase: snap.phase,
      state: snap.state,
      sync: snap.sync,
      signInAs: () => {},
      signIn: e.signIn,
      signOut: () => report(e.signOut()),
      receiveStock: (input) => report(e.receiveStock(input)),
      confirmDelivery: (input) => report(e.confirmDelivery(input)),
      updatePrices: (input) => report(e.updatePrices(input)),
      createSale: e.createSale,
      closeDay: () => report(e.closeDay()),
      updateSettings: (settings) => report(e.updateSettings(settings)),
      addProduct: e.addProduct,
      updateProduct: (id, changes) => report(e.updateProduct(id, changes)),
      changePassword: e.changePassword,
      resolveClash: (id, keep) => report(e.resolveClash(id, keep)),
      addExpense: (input) => report(e.addExpense(input)),
      addRider: e.addRider,
      updateRider: (id, changes) => report(e.updateRider(id, changes)),
      addStaff: e.addStaff,
      updateStaff: (id, changes) => report(e.updateStaff(id, changes)),
      saveStaffAccess: (id, input) => report(e.saveStaffAccess(id, input)),
      saveRole: (role) => report(e.saveRole(role)),
      photoUrl: e.photoUrl,
      resetDemo: () => {},
      uploadNow: e.uploadNow,
      deleteSale: (id) => report(e.deleteSale(id)),
      deleteExpense: (id) => report(e.deleteExpense(id)),
      deleteStockMove: (id) => report(e.deleteStockMove(id)),
      deleteCustomer: (id) => report(e.deleteCustomer(id)),
      removeProduct: (id) => report(e.removeProduct(id)),
      deleteRider: (id) => withoutLogin('rider', id, () => e.deleteRider(id)),
      deleteStaff: (id) => withoutLogin('staff', id, () => e.deleteStaff(id)),
      clearData: e.clearData,
    };
  }, [snap]);

  if (!store) return null;
  return <ViewAsLayer base={store}>{children}</ViewAsLayer>;
}

// ------------------------------------------------------------------- demo

let counter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  // Load what was saved on this phone; first run starts from the sample data.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as AppState) : null;
        setState(saved?.version === 1 ? saved : sampleState(today()));
      })
      .catch(() => setState(sampleState(today())));
  }, []);

  // Save every change on the phone.
  useEffect(() => {
    if (state) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  const store = useMemo<BaseStore | null>(() => {
    if (!state) return null;
    const waiting = state.pending.length;
    const note = (label: string, ref: string) => ({ id: newId('c'), at: new Date().toISOString(), label, ref });
    return {
      mode: 'demo',
      phase: state.session ? 'ready' : 'signedOut',
      // Hidden products stay in the saved data (old sales point at them) but are not shown.
      state: state.products.some((p) => p.hidden) ? { ...state, products: state.products.filter((p) => !p.hidden) } : state,
      // Demo mode never goes online, so there's no "no internet" sign to show.
      sync: { status: 'synced', waiting },
      signInAs: (role) =>
        update((s) => ({
          ...s,
          session:
            role === 'admin'
              ? { role, name: 'Kasim' }
              : role === 'rider'
                ? { role, name: 'Emeka', riderId: 'r1' }
                : { role, name: 'Kemi', staffId: 's1' },
        })),
      signIn: async () => "This copy of the app isn't connected to the business yet. Ask Admin for the latest version.",
      signOut: () => update((s) => ({ ...s, session: null })),
      receiveStock: ({ productId, qty, costPrice, batch, expiry }) =>
        update((s) => {
          const now = new Date().toISOString();
          const product = s.products.find((p) => p.id === productId);
          const moveId = newId('m');
          return {
            ...s,
            moves: [
              ...s.moves,
              {
                id: moveId,
                day: s.day,
                productId,
                kind: 'received',
                qty,
                at: now,
                by: s.session?.name ?? '',
                batch,
                expiry,
                costPrice,
              },
            ],
            products: s.products.map((p) => (p.id === productId ? { ...p, costPrice } : p)),
            pending: [
              ...s.pending,
              { id: newId('c'), at: now, label: `Received ${qty} × ${product?.name ?? 'product'}`, ref: moveId },
            ],
          };
        }),
      confirmDelivery: ({ orderId, receivedBy, method, amount, photo }) =>
        update((s) => {
          const order = s.orders.find((o) => o.id === orderId);
          if (!order || order.status !== 'pending') return s;
          const now = new Date().toISOString();
          return {
            ...s,
            orders: s.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'delivered',
                    deliveredAt: now,
                    deliveredDay: s.day,
                    receivedBy,
                    collected: { method, amount },
                    photo,
                  }
                : o,
            ),
            // Delivered goods leave the store, so stock goes down by itself.
            moves: [
              ...s.moves,
              ...order.items.map((it) => ({
                id: newId('m'),
                day: s.day,
                productId: it.productId,
                kind: 'delivered' as const,
                qty: it.qty,
                at: now,
                by: s.session?.name ?? '',
                orderId,
              })),
            ],
            pending: [
              ...s.pending,
              { id: newId('c'), at: now, label: `Delivered #${order.code} to ${order.customer}`, ref: orderId },
            ],
          };
        }),
      updatePrices: ({ productId, costPrice, sellPrice, lowAt }) =>
        update((s) => {
          const now = new Date().toISOString();
          const product = s.products.find((p) => p.id === productId);
          return {
            ...s,
            products: s.products.map((p) => (p.id === productId ? { ...p, costPrice, sellPrice, lowAt } : p)),
            pending: [
              ...s.pending,
              { id: newId('c'), at: now, label: `New prices for ${product?.name ?? 'product'}`, ref: productId },
            ],
          };
        }),
      createSale: async (input) => {
        const id = uuid();
        update((s) => {
          const now = new Date().toISOString();
          // No customer at all when the business doesn't take customer details.
          const none = !input.customerId && !input.newCustomer;
          const customerId = none ? '' : (input.customerId ?? uuid());
          const existing = s.customers.find((c) => c.id === customerId);
          const customer = existing ?? {
            id: customerId,
            name: input.newCustomer?.name ?? '',
            phone: input.newCustomer?.phone ?? '',
            area: input.area,
            address: input.address,
            since: s.day,
          };
          const code = nextOrderCode(s);
          return {
            ...s,
            customers: existing || none ? s.customers : [...s.customers, customer],
            orders: [
              ...s.orders,
              {
                id,
                code,
                day: s.day,
                createdAt: now,
                takenBy: s.session?.name ?? '',
                customerId,
                customer: customer.name,
                phone: customer.phone,
                area: input.area,
                address: input.address,
                riderId: input.riderId,
                items: input.items,
                payment: input.payment,
                status: 'pending',
              },
            ],
            pending: [
              ...s.pending,
              { id: newId('c'), at: now, label: `New sale #${code}${customer.name ? ` for ${customer.name}` : ''}`, ref: id },
            ],
          };
        });
        return id;
      },
      closeDay: () =>
        update((s) => {
          const next = nextDay(s.day);
          return {
            ...s,
            day: next,
            openings: { ...s.openings, [next]: closingStock(s) },
            pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: `Closed ${s.day}`, ref: next }],
          };
        }),
      updateSettings: (settings) =>
        update((s) => ({
          ...s,
          settings,
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Business settings', ref: 'settings' }],
        })),
      addProduct: async (input) => {
        const id = newId('p');
        update((s) => ({
          ...s,
          products: [...s.products, { ...input, id }],
          // A new product starts with nothing in the store; Receive stock adds to it.
          openings: { ...s.openings, [s.day]: { ...(s.openings[s.day] ?? {}), [id]: 0 } },
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: `New product ${input.name}`, ref: id }],
        }));
        return id;
      },
      updateProduct: (id, changes) =>
        update((s) => ({
          ...s,
          products: s.products.map((p) => (p.id === id ? { ...p, ...changes } : p)),
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Product details', ref: id }],
        })),
      changePassword: async () => 'Demo accounts have no password. This works with real accounts.',
      resolveClash: (id, keep) =>
        update((s) => {
          const c = s.clashes.find((x) => x.id === id);
          if (!c) return s;
          const keepMine = keep === 'mine' && c.table === 'products' && c.field === 'sell_price';
          return {
            ...s,
            products: keepMine ? s.products.map((p) => (p.id === c.rowId ? { ...p, sellPrice: Number(c.mine) } : p)) : s.products,
            clashes: s.clashes.filter((x) => x.id !== id),
            pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Sync clash choice', ref: id }],
          };
        }),
      addExpense: (input) =>
        update((s) => {
          const now = new Date().toISOString();
          const id = newId('e');
          return {
            ...s,
            expenses: [...s.expenses, { ...input, id, at: now, by: s.session?.name ?? '' }],
            pending: [
              ...s.pending,
              { id: newId('c'), at: now, label: `${input.category} expense, ${naira(input.amount)}`, ref: id },
            ],
          };
        }),
      addRider: async (input) => {
        const id = newId('r');
        update((s) => ({
          ...s,
          riders: [...s.riders, { ...input, id, initials: initialsOf(input.name) }],
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: `New rider ${input.name}`, ref: id }],
        }));
        return id;
      },
      updateRider: (id, changes) =>
        update((s) => ({
          ...s,
          riders: s.riders.map((r) =>
            r.id === id ? { ...r, ...changes, initials: changes.name ? initialsOf(changes.name) : r.initials } : r,
          ),
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Rider details', ref: id }],
        })),
      addStaff: async (input) => {
        const id = newId('s');
        update((s) => ({
          ...s,
          staff: [...s.staff, { ...input, id, initials: initialsOf(input.name) }],
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: `New staff ${input.name}`, ref: id }],
        }));
        return id;
      },
      updateStaff: (id, changes) =>
        update((s) => ({
          ...s,
          staff: s.staff.map((x) =>
            x.id === id ? { ...x, ...changes, initials: changes.name ? initialsOf(changes.name) : x.initials } : x,
          ),
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Staff details', ref: id }],
        })),
      saveStaffAccess: (id, { job, roleId, overrides, canSignIn }) =>
        update((s) => ({
          ...s,
          staff: s.staff.map((x) => (x.id === id ? { ...x, job, roleId, overrides, canSignIn } : x)),
          pending: [...s.pending, { id: newId('c'), at: new Date().toISOString(), label: 'Staff access', ref: id }],
        })),
      saveRole: (role) =>
        update((s) => ({
          ...s,
          roles: s.roles.some((r) => r.id === role.id) ? s.roles.map((r) => (r.id === role.id ? role : r)) : [...s.roles, role],
          pending: [
            ...s.pending,
            { id: newId('c'), at: new Date().toISOString(), label: `Staff role ${role.name}`, ref: role.id },
          ],
        })),
      // Demo photos stay on this phone, so the saved address can be shown as it is.
      photoUrl: async (photo) => photo,
      resetDemo: () => setState({ ...sampleState(today()), session: state.session }),
      // Demo mode never goes online: everything is already "uploaded".
      uploadNow: async () => true,
      deleteSale: (orderId) =>
        update((s) => ({
          ...s,
          orders: s.orders.filter((o) => o.id !== orderId),
          moves: s.moves.filter((m) => m.orderId !== orderId),
          pending: [...s.pending, note('Deleted a sale', orderId)],
        })),
      deleteExpense: (id) =>
        update((s) => ({
          ...s,
          expenses: s.expenses.filter((e) => e.id !== id),
          pending: [...s.pending, note('Deleted an expense', id)],
        })),
      deleteStockMove: (id) =>
        update((s) => ({
          ...s,
          moves: s.moves.filter((m) => !(m.id === id && m.kind === 'received')),
          pending: [...s.pending, note('Deleted a stock entry', id)],
        })),
      deleteCustomer: (id) =>
        update((s) => ({
          ...s,
          customers: s.customers.filter((c) => c.id !== id),
          orders: s.orders.map((o) => (o.customerId === id ? { ...o, customerId: '' } : o)),
          pending: [...s.pending, note('Deleted a customer', id)],
        })),
      removeProduct: (id) =>
        update((s) => {
          const sold = s.orders.some((o) => o.items.some((it) => it.productId === id));
          if (sold) {
            return {
              ...s,
              products: s.products.map((p) => (p.id === id ? { ...p, hidden: true } : p)),
              pending: [...s.pending, note('Hid a product', id)],
            };
          }
          return {
            ...s,
            products: s.products.filter((p) => p.id !== id),
            moves: s.moves.filter((m) => m.productId !== id),
            openings: Object.fromEntries(
              Object.entries(s.openings).map(([day, list]) => [
                day,
                Object.fromEntries(Object.entries(list).filter(([p]) => p !== id)),
              ]),
            ),
            pending: [...s.pending, note('Removed a product', id)],
          };
        }),
      deleteRider: (id) =>
        withoutLogin('rider', id, () =>
          update((s) =>
            s.orders.some((o) => o.riderId === id)
              ? s
              : { ...s, riders: s.riders.filter((r) => r.id !== id), pending: [...s.pending, note('Removed a rider', id)] },
          ),
        ),
      deleteStaff: (id) =>
        withoutLogin('staff', id, () =>
          update((s) => ({
            ...s,
            staff: s.staff.filter((x) => x.id !== id),
            pending: [...s.pending, note('Removed staff', id)],
          })),
        ),
      clearData: async (parts) => {
        const has = (p: ClearPart) => parts.includes(p);
        const products = has('products');
        const sales = products || has('sales');
        const stock = products || has('stock');
        update((s) => ({
          ...s,
          moves: stock ? [] : sales ? s.moves.filter((m) => !m.orderId) : s.moves,
          openings: stock ? {} : s.openings,
          orders: sales ? [] : has('customers') ? s.orders.map((o) => ({ ...o, customerId: '' })) : s.orders,
          customers: has('customers') ? [] : s.customers,
          expenses: has('expenses') ? [] : s.expenses,
          products: products ? [] : s.products,
          pending: [...s.pending, note('Cleared old data', parts.join(','))],
        }));
      },
    };
  }, [state, update]);

  if (!store) return null;
  return <ViewAsLayer base={store}>{children}</ViewAsLayer>;
}
