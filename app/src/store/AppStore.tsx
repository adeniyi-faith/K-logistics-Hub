// The app's memory. Every change is saved on the phone straight away (offline first)
// and added to a "waiting to upload" list. Uploading will be added once the online
// database is chosen; until then the list just grows and shows in the sync badge.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { sampleState } from '../data/sample';
import { AppState, Order, Role } from '../data/types';
import { today } from '../lib/format';

const KEY = 'klh-state-v1';

type ReceiveInput = {
  productId: string;
  qty: number;
  costPrice: number;
  batch: string;
  expiry: string;
};

type ConfirmInput = {
  orderId: string;
  receivedBy: string;
  method: NonNullable<Order['collected']>['method'];
  amount: number;
};

type Store = {
  state: AppState;
  signInAs: (role: Role) => void;
  signOut: () => void;
  receiveStock: (input: ReceiveInput) => void;
  confirmDelivery: (input: ConfirmInput) => void;
  resetDemo: () => void;
};

const Ctx = createContext<Store | null>(null);

let counter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function AppStoreProvider({ children }: { children: ReactNode }) {
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
    return {
      state,
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
              { id: moveId, day: s.day, productId, kind: 'received', qty, at: now, by: s.session?.name ?? '', batch, expiry, costPrice },
            ],
            products: s.products.map((p) => (p.id === productId ? { ...p, costPrice } : p)),
            pending: [...s.pending, { id: newId('c'), at: now, label: `Received ${qty} × ${product?.name ?? 'product'}`, ref: moveId }],
          };
        }),
      confirmDelivery: ({ orderId, receivedBy, method, amount }) =>
        update((s) => {
          const order = s.orders.find((o) => o.id === orderId);
          if (!order || order.status !== 'pending') return s;
          const now = new Date().toISOString();
          return {
            ...s,
            orders: s.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: 'delivered', deliveredAt: now, receivedBy, collected: { method, amount } }
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
                by: order.riderId,
                orderId,
              })),
            ],
            pending: [...s.pending, { id: newId('c'), at: now, label: `Delivered #${orderId} to ${order.customer}`, ref: orderId }],
          };
        }),
      resetDemo: () => setState({ ...sampleState(today()), session: state.session }),
    };
  }, [state, update]);

  if (!store) return null;
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}
