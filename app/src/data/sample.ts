// Sample data so the app has something to show before the online database exists.
// Products are the real list from the design. Prices, stock and orders are made up:
// the cost price (₦14,000) and rider pay (₦5,000 per delivery) are placeholders.
import { AppState, Customer, Order, Product, StockMove } from './types';

const P = (
  id: string,
  name: string,
  group: string,
  unit: string,
  pack: string,
  opening: number,
  lowAt = 10,
): [Product, number] => [
  {
    id,
    name,
    group,
    unit,
    pack,
    costPrice: 14000,
    sellPrice: 21500,
    lowAt,
    nafdac: `A7-10${id.replace(/\D/g, '').padStart(4, '0')}L`,
    supplier: 'Bioharb',
  },
  opening,
];

const LIST: [Product, number][] = [
  P('p01', 'Mullein herbal tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 40),
  P('p02', 'Orafix Power Duo', 'Oral care', 'pack', 'Pack of 2', 36),
  P('p03', 'Fibnova', 'Capsules', 'pack', 'Pack of 60 capsules', 30),
  P('p04', 'Sabana Pro', 'Capsules', 'bottle', 'Bottle of 60 capsules', 25),
  P('p05', 'Kidney Support tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 22),
  P('p06', 'Prostdesx', "Men's health", 'bottle', 'Bottle of 60 capsules', 18),
  P('p07', '5 Vitamin C', 'Capsules', 'bottle', 'Bottle of 60 tablets', 12),
  P('p08', 'Glow Serum', 'Skin care', 'bottle', 'Bottle, 30 ml', 6),
  P('p09', 'Kojic Acid', 'Skin care', 'bar', 'Soap bar', 9),
  P('p10', 'Baysel', 'Capsules', 'bottle', 'Bottle of 60 capsules', 20),
  P('p11', 'Boazem', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  P('p12', 'Cazibin', 'Capsules', 'bottle', 'Bottle of 60 capsules', 14),
  P('p13', 'Dark Spot', 'Skin care', 'tube', 'Cream, 50 g', 18),
  P('p14', 'Devano', 'Capsules', 'bottle', 'Bottle of 60 capsules', 21),
  P('p15', 'Facial Soap', 'Skin care', 'bar', 'Soap bar', 30),
  P('p16', 'Hair Plus Formula', 'Hair care', 'bottle', 'Bottle, 100 ml', 15),
  P('p17', 'Menopause Support', "Women's health", 'bottle', 'Bottle of 60 capsules', 17),
  P('p18', 'Mvera', 'Capsules', 'bottle', 'Bottle, 500 ml', 19),
  P('p19', 'Proxan', "Men's health", 'bottle', 'Bottle of 60 capsules', 13),
  P('p20', 'Sootra', 'Capsules', 'bottle', 'Bottle of 60 capsules', 24),
  P('p21', 'Soluvia', "Women's health", 'bottle', 'Bottle of 60 capsules', 15),
  P('p22', 'Sovana', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  P('p23', 'Swanky', "Men's health", 'bottle', 'Bottle of 60 capsules', 20),
  P('p24', 'Visura', 'Capsules', 'bottle', 'Bottle of 60 capsules', 18),
  P('p25', 'Zouwa', 'Capsules', 'bottle', 'Bottle of 60 capsules', 14),
  P('p26', 'Zudes Capsule', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  P('p27', 'Zemora Tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 19),
];

function at(day: string, hhmm: string): string {
  return new Date(`${day}T${hhmm}:00`).toISOString();
}

export function sampleState(day: string): AppState {
  const products = LIST.map(([p]) => p);
  const opening = Object.fromEntries(LIST.map(([p, n]) => [p.id, n]));
  const price = 21500;

  // A day this many days before `day`, as "YYYY-MM-DD".
  const before = (n: number) => {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const customers: Customer[] = [
    ['c1', 'Grace Herbal Store', '0803 111 2233', 'Rumuola', 'Rumuola Road, Port Harcourt'],
    ['c2', 'Joy Pharmacy', '0806 222 1188', 'Choba', 'Choba Park, Port Harcourt'],
    ['c3', 'Peace Chemist', '0813 555 2040', 'Eleme', 'Eleme Junction, Port Harcourt'],
    ['c4', 'Blessing Ibe', '0905 777 3012', 'Rumuokoro', 'Rumuokoro Market Road, PH'],
    ['c5', 'Mama Chioma Chemist', '0802 444 9090', 'D-Line', 'Ikwerre Road, D-Line, PH'],
    ['c6', 'Divine Health Store', '0816 333 7766', 'GRA', 'Tombia Street, GRA Phase 2, PH'],
    ['c7', 'Ada Okafor', '0703 888 1245', 'Ada George', 'Ada George Road, PH'],
    ['c8', 'St. Luke Pharmacy', '0809 121 4545', 'Trans-Amadi', 'Trans-Amadi Industrial Layout, PH'],
  ].map(([id, name, phone, area, address]) => ({ id, name, phone, area, address, since: before(240) }));
  const byId = new Map(customers.map((c) => [c.id, c]));

  // [daysAgo, number, customer, rider, items, payment, taken, delivered?, receivedBy?]
  type Seed = [number, number, string, string, [string, number][], Order['payment'], string, string?, string?];
  const seeds: Seed[] = [
    [6, 4, 'c1', 'r1', [['p01', 6]], 'on_delivery', '09:10', '11:30', 'Grace'],
    [5, 7, 'c6', 'r3', [['p05', 4]], 'transfer', '10:00', '12:40', 'Divine'],
    [
      3,
      9,
      'c1',
      'r1',
      [
        ['p02', 4],
        ['p03', 4],
      ],
      'transfer',
      '08:50',
      '10:15',
      'Grace',
    ],
    [2, 3, 'c5', 'r1', [['p14', 4]], 'on_delivery', '13:30', '16:20', 'Ifeanyi (staff)'],
    [1, 6, 'c3', 'r2', [['p20', 3]], 'on_delivery', '09:20', '11:00', 'Peace'],
    [1, 8, 'c2', 'r1', [['p23', 2]], 'transfer', '11:45', '14:10', 'Joy (owner)'],
    [0, 11, 'c2', 'r1', [['p23', 3]], 'on_delivery', '08:10', '10:52', 'Joy (owner)'],
    [0, 12, 'c3', 'r1', [['p24', 2]], 'transfer', '08:25', '09:48', 'Peace'],
    [0, 13, 'c4', 'r1', [['p17', 1]], 'on_delivery', '08:30', '09:05', 'Blessing'],
    [0, 14, 'c5', 'r2', [['p14', 4]], 'transfer', '08:40', '11:20', 'Mama Chioma'],
    [
      0,
      15,
      'c6',
      'r2',
      [
        ['p03', 3],
        ['p07', 2],
      ],
      'on_delivery',
      '09:00',
      '12:05',
      'Mr Kelechi',
    ],
    [
      0,
      16,
      'c7',
      'r3',
      [
        ['p08', 1],
        ['p13', 2],
      ],
      'transfer',
      '09:15',
    ],
    [0, 17, 'c8', 'r3', [['p02', 4]], 'on_delivery', '09:40'],
    [0, 18, 'c1', 'r1', [['p01', 6]], 'on_delivery', '10:05'],
    [0, 19, 'c3', 'r1', [['p20', 2]], 'on_delivery', '10:30'],
  ];

  const orders: Order[] = seeds.map(([ago, n, customerId, riderId, items, payment, taken, delivered, receivedBy]) => {
    const d = before(ago);
    const c = byId.get(customerId)!;
    const lines = items.map(([productId, qty]) => ({ productId, qty, unitPrice: price }));
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const code = `S-${d.slice(5).replace('-', '')}-${String(n).padStart(2, '0')}`;
    return {
      id: code,
      code,
      day: d,
      createdAt: at(d, taken),
      takenBy: 'Kemi',
      customerId,
      customer: c.name,
      phone: c.phone,
      area: c.area,
      address: c.address,
      riderId,
      items: lines,
      payment,
      status: delivered ? 'delivered' : 'pending',
      ...(delivered
        ? {
            deliveredAt: at(d, delivered),
            receivedBy,
            collected:
              payment === 'transfer' ? { method: 'paid_before' as const, amount: 0 } : { method: 'cash' as const, amount: total },
          }
        : {}),
    };
  });

  const riders = [
    { id: 'r1', name: 'Emeka Obi', initials: 'EO', phone: '0803 456 7788', bike: 'Bike 1 · PHC-234KA', ratePerDelivery: 5000 },
    { id: 'r2', name: 'Tunde Bello', initials: 'TB', phone: '0806 991 2210', bike: 'Bike 2 · PHC-118KB', ratePerDelivery: 5000 },
    { id: 'r3', name: 'Musa Ali', initials: 'MA', phone: '0810 334 9087', bike: 'Bike 3 · PHC-772KC', ratePerDelivery: 5000 },
  ];
  const riderName = new Map(riders.map((r) => [r.id, r.name]));

  let n = 0;
  const id = () => `m${++n}`;
  const received = (productId: string, qty: number, hhmm: string, batch: string, expiry: string): StockMove => ({
    id: id(),
    day,
    productId,
    kind: 'received',
    qty,
    at: at(day, hhmm),
    by: 'Kemi',
    batch,
    expiry,
    costPrice: 14000,
  });
  const moves: StockMove[] = [
    received('p01', 24, '08:00', 'MT-0924', '2028-03'),
    received('p03', 20, '08:00', 'FB-0925', '2027-11'),
    received('p06', 12, '08:05', 'PX-0912', '2027-08'),
  ];
  for (const o of orders) {
    if (o.status !== 'delivered') continue;
    for (const it of o.items) {
      moves.push({
        id: id(),
        day: o.day,
        productId: it.productId,
        kind: 'delivered',
        qty: it.qty,
        at: o.deliveredAt!,
        by: riderName.get(o.riderId) ?? '',
        orderId: o.id,
      });
    }
  }

  return {
    version: 1,
    day,
    session: null,
    products,
    opening,
    moves,
    riders,
    customers,
    orders,
    expenses: [
      { id: 'e1', day, category: 'Fuel', note: 'Fuel for 3 bikes', amount: 18000 },
      { id: 'e2', day, category: 'Bike repairs', note: 'Brake pads, Bike 2', amount: 15500 },
      { id: 'e3', day, category: 'Data & airtime', note: 'Office data', amount: 8000 },
    ],
    pending: [],
  };
}
