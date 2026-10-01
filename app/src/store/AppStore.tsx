// The app's memory, shared by every screen.
//
// Two ways to run:
// - Live (Android/iPhone with Supabase + PowerSync set up in .env.local): real accounts,
//   data kept on the phone and synced with the online database. See src/live.
// - Demo (no setup, or the browser): sample data saved only on this phone. Every change
//   goes on a "waiting to upload" list so the sync badge behaves like the real thing.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { sampleState } from '../data/sample';
import { AppState, Role, Settings } from '../data/types';
import { today } from '../lib/format';
import { liveAvailable } from '../live/config';
import { createLiveEngine } from '../live/engine';
import { ConfirmInput, LiveEngine, LiveSnapshot, Phase, PriceInput, ReceiveInput, SaleInput, SyncInfo } from '../live/types';
import { uuid } from '../lib/id';
import { nextOrderCode } from '../lib/sales';
import { closingStock, nextDay } from '../lib/stock';

const KEY = 'klh-state-v5';

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
  /** Admin: business settings such as asking riders for a delivery photo. */
  updateSettings: (settings: Settings) => void;
  /** Something the app can show for a delivery photo, or null when it can't be loaded now. */
  photoUrl: (photo: string) => Promise<string | null>;
  /** Demo only: put the sample data back the way it started. */
  resetDemo: () => void;
};

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return liveAvailable ? <LiveProvider>{children}</LiveProvider> : <DemoProvider>{children}</DemoProvider>;
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

  const store = useMemo<Store | null>(() => {
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
      photoUrl: e.photoUrl,
      resetDemo: () => {},
    };
  }, [snap]);

  if (!store) return null;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
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

  const store = useMemo<Store | null>(() => {
    if (!state) return null;
    const waiting = state.pending.length;
    return {
      mode: 'demo',
      phase: state.session ? 'ready' : 'signedOut',
      state,
      sync: { status: waiting ? 'offline' : 'synced', waiting },
      signInAs: (role) =>
        update((s) => ({
          ...s,
          session:
            role === 'admin'
              ? { role, name: 'Kasim' }
              : role === 'rider'
                ? { role, name: 'Emeka', riderId: 'r1' }
                : { role, name: 'Kemi' },
        })),
      signIn: async () => 'Real accounts need Supabase and PowerSync set up. Use a demo button below.',
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
          const customerId = input.customerId ?? uuid();
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
            customers: existing ? s.customers : [...s.customers, customer],
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
            pending: [...s.pending, { id: newId('c'), at: now, label: `New sale #${code} for ${customer.name}`, ref: id }],
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
      // Demo photos stay on this phone, so the saved address can be shown as it is.
      photoUrl: async (photo) => photo,
      resetDemo: () => setState({ ...sampleState(today()), session: state.session }),
    };
  }, [state, update]);

  if (!store) return null;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
