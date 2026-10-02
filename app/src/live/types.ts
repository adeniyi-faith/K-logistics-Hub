import { Overrides, StaffRole } from '../data/access';
import { AppState, Expense, Order, Product, Rider, Settings, Staff } from '../data/types';

export type SyncInfo = {
  /** synced: all uploaded. offline: no connection. syncing: uploading or downloading now. */
  status: 'synced' | 'offline' | 'syncing';
  /** Changes saved on this phone and not uploaded yet. */
  waiting: number;
};

/** signedOut: show sign-in. loading: signed in, waiting for the first download. ready: show the app. */
export type Phase = 'signedOut' | 'loading' | 'ready';

export type LiveSnapshot = { phase: Phase; state: AppState; sync: SyncInfo };

export type ReceiveInput = { productId: string; qty: number; costPrice: number; batch: string; expiry: string };

export type ConfirmInput = {
  orderId: string;
  receivedBy: string;
  method: NonNullable<Order['collected']>['method'];
  amount: number;
  /** A photo file on this phone. */
  photo?: string;
};

export type SaleInput = {
  /** An existing customer, or the details of a new one. */
  customerId?: string;
  newCustomer?: { name: string; phone: string };
  area: string;
  address: string;
  riderId: string;
  payment: Order['payment'];
  items: Order['items'];
};

export type ExpenseInput = Pick<Expense, 'day' | 'category' | 'note' | 'amount' | 'frequency' | 'bike' | 'payee' | 'receipt'>;

export type RiderInput = Omit<Rider, 'id' | 'initials'>;

export type StaffInput = Omit<Staff, 'id' | 'initials'>;

export type AccessInput = { job: string; roleId: string; overrides: Overrides; canSignIn: boolean };

export type PriceInput = { productId: string; costPrice: number; sellPrice: number; lowAt: number };

export type ProductInput = Omit<Product, 'id'>;

/** What "Clear old data" can wipe. */
export type ClearPart = 'sales' | 'stock' | 'products' | 'customers' | 'expenses';

/** Which value stays after a sync clash: this phone's ("mine") or the one already on the server ("theirs"). */
export type ClashChoice = 'mine' | 'theirs';

/** The real app: Supabase for accounts and the online database, plus our own sync to the copy kept on the phone. */
export type LiveEngine = {
  subscribe: (listener: (snap: LiveSnapshot) => void) => () => void;
  /** Returns an error message, or null when signed in. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  receiveStock: (input: ReceiveInput) => Promise<void>;
  confirmDelivery: (input: ConfirmInput) => Promise<void>;
  updatePrices: (input: PriceInput) => Promise<void>;
  /** Saves a new sale and returns its id. */
  createSale: (input: SaleInput) => Promise<string>;
  /** Copies each product's closing stock into the next day as opening stock, and moves the business to that day. */
  closeDay: () => Promise<void>;
  /** A new logo is a photo file on this phone; it uploads by itself. */
  updateSettings: (settings: Settings) => Promise<void>;
  /** Saves a new product and returns its id. */
  addProduct: (input: ProductInput) => Promise<string>;
  updateProduct: (id: string, changes: Partial<ProductInput>) => Promise<void>;
  /** The receipt, if any, is a photo file on this phone. */
  addExpense: (input: ExpenseInput) => Promise<void>;
  /** Saves a new rider and returns their id. */
  addRider: (input: RiderInput) => Promise<string>;
  /** Admin, or a rider changing their own details. A new photo is a file on this phone. */
  updateRider: (id: string, changes: Partial<RiderInput>) => Promise<void>;
  /** Needs internet. Returns an error message, or null when done. */
  changePassword: (password: string) => Promise<string | null>;
  /** Admin: keep one of the two values after a sync clash. */
  resolveClash: (id: string, keep: ClashChoice) => Promise<void>;
  /** Saves a new staff member and returns their id. */
  addStaff: (input: StaffInput) => Promise<string>;
  updateStaff: (id: string, changes: Partial<StaffInput>) => Promise<void>;
  /** Admin: give a staff member a role and any changes just for them. */
  saveStaffAccess: (staffId: string, input: AccessInput) => Promise<void>;
  /** Admin: add or change a staff role. Everyone with the role gets the change. */
  saveRole: (role: StaffRole) => Promise<void>;
  /** Uploads what is waiting now. True when the given record (or everything) has reached the server. */
  uploadNow: (rowId?: string) => Promise<boolean>;
  /** Admin: removes a sale, its items and any stock it took out (the stock goes back). */
  deleteSale: (orderId: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  /** Admin: removes one "received" stock entry, e.g. one typed by mistake. */
  deleteStockMove: (id: string) => Promise<void>;
  /** Admin: removes a customer. Their past sales keep the name and phone copied onto them. */
  deleteCustomer: (id: string) => Promise<void>;
  /** Admin: a product in past sales is hidden (so old records stay right); any other is removed with its stock records. */
  removeProduct: (id: string) => Promise<void>;
  /** Admin: only for riders with no sales; their sign-in must be removed first. */
  deleteRider: (id: string) => Promise<void>;
  /** Admin: their sign-in must be removed first. */
  deleteStaff: (id: string) => Promise<void>;
  /** Admin: wipes whole kinds of records, e.g. the sample data the business started with. */
  clearData: (parts: ClearPart[]) => Promise<void>;
  /** A web address or file the app can show for a delivery photo, or null when it can't be loaded now. */
  photoUrl: (photo: string) => Promise<string | null>;
};
