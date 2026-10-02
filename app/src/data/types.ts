import { Overrides, StaffRole } from './access';

export type Role = 'admin' | 'staff' | 'rider';

export type Product = {
  id: string;
  name: string;
  group: string;
  /** What one unit is called, e.g. "box", "bottle", "pack". */
  unit: string;
  /** Plain description of one unit, e.g. "Box of 20 tea bags". */
  pack: string;
  costPrice: number;
  sellPrice: number;
  /** Show "Low stock" when the stock falls to this number or below. */
  lowAt: number;
  nafdac: string;
  supplier: string;
  /** Demo only: removed by Admin but kept because past sales point at it. Never shown. */
  hidden?: boolean;
};

/**
 * Stock is never typed in directly. It is worked out from these movements:
 * Closing = Opening + Received − Delivered.
 */
export type StockMove = {
  id: string;
  day: string;
  productId: string;
  /** added / removed: a stock count change (damage, a return, a recount), with the reason in note. */
  kind: 'received' | 'delivered' | 'added' | 'removed';
  qty: number;
  at: string;
  by: string;
  batch?: string;
  expiry?: string;
  costPrice?: number;
  orderId?: string;
  /** Why a count change was made, e.g. "Damaged". */
  note?: string;
};

/** active: can be given deliveries. The app shows "On delivery" or "Available" from their orders. */
export type RiderStatus = 'active' | 'off_duty' | 'bike_repair';

export type Rider = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  /** Bike name and plate, e.g. "Bike 1 · PHC-234KA". */
  bike: string;
  /** Pay per completed delivery (₦5,000 in the design, to be confirmed). */
  ratePerDelivery: number;
  status: RiderStatus;
  /** The day the status last changed, "YYYY-MM-DD". */
  statusSince?: string;
  address?: string;
  bikeModel?: string;
  bikeColour?: string;
  /** NIN slip, driver's licence, voter's card or passport. */
  idType?: string;
  idNumber?: string;
  /** Day they joined, "YYYY-MM-DD". */
  joined?: string;
  /** Rider's own details, which they can change themselves. */
  phone2?: string;
  kinName?: string;
  kinPhone?: string;
  kinRelation?: string;
  /** Where to pay them: bank or wallet, account number and account name. */
  payBank?: string;
  payAccount?: string;
  payName?: string;
  /** The day the rider last changed where to pay them, so Admin can check it before paying. */
  payChanged?: string;
  /** Their photo: a file on this phone, or its name in online storage. */
  photo?: string;
  /** Something the rider asked Admin to change (name, ID or bike), and the day they asked. */
  changeRequest?: string;
  changeRequestAt?: string;
  /** Papers the rider uploaded, e.g. driver's licence. */
  documents?: RiderDoc[];
  /** Whether their account may sign in (undefined: no sign-in yet). */
  canSignIn?: boolean;
};

/** A photo of one of a rider's papers. photo: a file on this phone, or its name in online storage. */
export type RiderDoc = { id: string; kind: string; photo: string; day: string };

/** The papers a rider can upload. */
export const DOC_KINDS = ["Driver's licence", 'National ID (NIN)', 'Bike papers', 'Guarantor form', 'Other'];

/** Someone on the payroll who is not a rider (riders are paid per delivery). */
export type Staff = {
  id: string;
  name: string;
  initials: string;
  /** Their job, e.g. "Manager" or "Store keeper". */
  job: string;
  phone: string;
  /** Pay for each month or week. */
  pay: number;
  payEvery: 'month' | 'week';
  active: boolean;
  /** Their staff role (see access.ts); missing means no access yet. */
  roleId?: string;
  /** What Admin changed for this one person on top of the role. */
  overrides?: Overrides;
  /** Whether their account may sign in. Turning it off blocks them as soon as they are online. */
  canSignIn?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  /** Delivery area, e.g. "Rumuola". */
  area: string;
  address: string;
  /** Day they were added, "YYYY-MM-DD". */
  since: string;
};

/** Delivery areas from the design. Admin can change the list in Business settings. */
export const AREAS = [
  'GRA',
  'Rumuola',
  'Trans-Amadi',
  'Rumuokoro',
  'Mile 1',
  'D-Line',
  'Ada George',
  'Choba',
  'Eleme',
  'Outside PH',
];

export type OrderItem = { productId: string; qty: number; unitPrice: number };

export type Order = {
  id: string;
  /** Short number people read out, e.g. "S-0930-18". */
  code: string;
  day: string;
  createdAt: string;
  /** Name of the person who took the order. */
  takenBy: string;
  customerId: string;
  /** Customer details are copied onto the order so riders see them without the customer list. */
  customer: string;
  phone: string;
  area: string;
  address: string;
  riderId: string;
  items: OrderItem[];
  /** Customers never owe: either paid by transfer first, or paid to the rider on delivery. */
  payment: 'transfer' | 'on_delivery';
  status: 'pending' | 'delivered' | 'failed';
  deliveredAt?: string;
  /** The business day the delivery was recorded on (counts for that day's rider earnings). */
  deliveredDay?: string;
  receivedBy?: string;
  collected?: { method: 'cash' | 'transfer' | 'paid_before'; amount: number };
  failReason?: string;
  /** Delivery photo: a file on this phone, or its name in online storage. */
  photo?: string;
};

/** Business settings Admin can change. */
export type Settings = {
  /** Riders must take a photo when confirming a delivery. */
  requirePhoto: boolean;
  businessName: string;
  tagline: string;
  location: string;
  /** The logo: a file on this phone, or its name in online storage. Missing means the built-in logo. */
  logo?: string;
  expenseCategories: string[];
  productGroups: string[];
  /** What a unit can be called, e.g. bottle, box, pack. */
  units: string[];
  defaultUnit: string;
  /** Low-stock alert for new products (each product can have its own). */
  lowStockAt: number;
  /** When off, a sale can't take more than what is in the store. */
  allowZeroStock: boolean;
  areas: string[];
  /** The business's own words for "sale" and "rider". */
  words: { sale: string; rider: string };
  /** Take the customer's name and phone on each sale. Off: sales are saved with no customer. */
  customerDetails: boolean;
  /** The title shown for an Admin instead of "Admin", by their name, e.g. { Faith: 'Developer' }. */
  titles: Record<string, string>;
};

/** How often an expense comes up. It is a label for grouping; nothing repeats by itself. */
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'one_time';

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One-time' },
];

/** Expense categories from the design. Admin can change the list in Business settings. */
export const EXPENSE_CATEGORIES = ['Fuel', 'Staff pay', 'Transport', 'Bike care', 'Repairs', 'Packaging', 'Other'] as const;

export type Expense = {
  id: string;
  /** The business day the money was spent on (counts against that day's profit). */
  day: string;
  category: string;
  note: string;
  amount: number;
  frequency: Frequency;
  /** Which bike it was for, if any. */
  bike?: string;
  /** When it was written down, and by whom. */
  at: string;
  by: string;
  /** For pay: the staff member or rider who was paid. */
  payee?: string;
  /** Receipt photo: a file on this phone, or its name in online storage. */
  receipt?: string;
};

/**
 * The same thing was changed on two phones while one was offline. The server kept the
 * value that arrived first ("theirs"); Admin picks which one stays.
 */
export type Clash = {
  id: string;
  /** Which kind of record: products, customers, riders, staff, staff_roles or business. */
  table: string;
  rowId: string;
  /** The column that clashed, e.g. "sell_price". */
  field: string;
  /** The value from the phone that uploaded last, and who saved it. */
  mine: unknown;
  mineBy: string;
  /** The value already on the server. */
  theirs: unknown;
  at: string;
};

/** A change saved on this phone that has not been uploaded yet. */
export type PendingChange = { id: string; at: string; label: string; /** The record this change saved. */ ref: string };

export type AppState = {
  version: 1;
  /** The day the shop is currently recording ("YYYY-MM-DD"). */
  day: string;
  /** viewing: Admin is looking at the app as this staff member or rider (see "See the app as"). */
  session: { role: Role; name: string; riderId?: string; staffId?: string; viewing?: boolean } | null;
  settings: Settings;
  products: Product[];
  /** Opening stock per day, then per product id: openings["2026-10-01"]["p01"]. */
  openings: Record<string, Record<string, number>>;
  moves: StockMove[];
  riders: Rider[];
  staff: Staff[];
  roles: StaffRole[];
  customers: Customer[];
  orders: Order[];
  expenses: Expense[];
  /** Sync clashes waiting for Admin to pick a value. */
  clashes: Clash[];
  pending: PendingChange[];
  /** Changes the server refused (e.g. not allowed). The phone has been put back in line with the server. */
  refused?: RefusedChange[];
};

/** A change saved on this phone that the server said no to. */
export type RefusedChange = { id: string; at: string; label: string; reason: string };
