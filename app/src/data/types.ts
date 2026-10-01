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
};

/**
 * Stock is never typed in directly. It is worked out from these movements:
 * Closing = Opening + Received − Delivered.
 */
export type StockMove = {
  id: string;
  day: string;
  productId: string;
  kind: 'received' | 'delivered';
  qty: number;
  at: string;
  by: string;
  batch?: string;
  expiry?: string;
  costPrice?: number;
  orderId?: string;
};

export type Rider = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  bike: string;
  /** Pay per completed delivery (₦5,000 in the design, to be confirmed). */
  ratePerDelivery: number;
};

export type OrderItem = { productId: string; qty: number; unitPrice: number };

export type Order = {
  id: string;
  day: string;
  createdAt: string;
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
  receivedBy?: string;
  collected?: { method: 'cash' | 'transfer' | 'paid_before'; amount: number };
  failReason?: string;
};

export type Expense = { id: string; day: string; category: string; note: string; amount: number };

/** A change saved on this phone that has not been uploaded yet. */
export type PendingChange = { id: string; at: string; label: string; /** The record this change saved. */ ref: string };

export type AppState = {
  version: 1;
  /** The day the shop is currently recording ("YYYY-MM-DD"). */
  day: string;
  session: { role: Role; name: string; riderId?: string } | null;
  products: Product[];
  /** Opening stock for the current day, per product id. */
  opening: Record<string, number>;
  moves: StockMove[];
  riders: Rider[];
  orders: Order[];
  expenses: Expense[];
  pending: PendingChange[];
};
