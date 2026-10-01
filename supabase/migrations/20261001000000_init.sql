-- K-Logistics Hub: the online database (Supabase / Postgres).
-- Run this once in the Supabase SQL editor (or with `supabase db push`).
--
-- Stock is never typed in: it is worked out from stock_moves
-- (Closing = Opening + Received − Delivered), which keeps sync clashes rare.

-- ---------------------------------------------------------------- tables

create table public.business (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'K-Logistics Hub',
  -- The day the shop is recording. Moves forward when the day is closed.
  current_day date not null default current_date
);

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text not null default '',
  phone text not null default '',
  bike text not null default '',
  -- Pay per completed delivery (₦5,000 in the design, to be confirmed).
  rate_per_delivery integer not null default 5000
);

-- One row per person who can sign in. id is the Supabase Auth user id.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'staff', 'rider')),
  rider_id uuid references public.riders (id),
  can_sign_in boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_group text not null default '',
  unit text not null default 'unit',
  pack text not null default '',
  -- Each product's own prices. Both can be changed at any time in the app.
  cost_price integer not null default 0 check (cost_price >= 0),
  sell_price integer not null default 0 check (sell_price >= 0),
  low_at integer not null default 10,
  nafdac text not null default '',
  supplier text not null default '',
  active boolean not null default true
);

-- Opening stock for each product on each day.
create table public.day_openings (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  product_id uuid not null references public.products (id),
  opening integer not null default 0,
  unique (day, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  customer text not null,
  phone text not null default '',
  area text not null default '',
  address text not null default '',
  rider_id uuid references public.riders (id),
  -- Customers never owe: paid by transfer first, or paid to the rider on delivery.
  payment text not null check (payment in ('transfer', 'on_delivery')),
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed')),
  delivered_at timestamptz,
  received_by text,
  collected_method text check (collected_method in ('cash', 'transfer', 'paid_before')),
  collected_amount integer,
  fail_reason text
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Copied from the order so each rider's phone only downloads their own items.
  rider_id uuid references public.riders (id),
  product_id uuid not null references public.products (id),
  qty integer not null check (qty > 0),
  unit_price integer not null check (unit_price >= 0)
);

create table public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  product_id uuid not null references public.products (id),
  kind text not null check (kind in ('received', 'delivered')),
  qty integer not null check (qty > 0),
  at timestamptz not null default now(),
  by_name text not null default '',
  batch text,
  expiry text,
  cost_price integer,
  order_id uuid references public.orders (id),
  created_by uuid default auth.uid()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  day date not null default current_date,
  category text not null,
  note text not null default '',
  amount integer not null check (amount >= 0)
);

create index on public.stock_moves (day, product_id);
create index on public.orders (day);
create index on public.orders (rider_id);
create index on public.order_items (order_id);

-- ---------------------------------------------------------- who is who

create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and can_sign_in
$$;

create function public.my_rider_id() returns uuid
language sql stable security definer set search_path = public as $$
  select rider_id from public.profiles where id = auth.uid() and role = 'rider' and can_sign_in
$$;

-- ------------------------------------------------------ access rules (RLS)
-- Admin and Staff can use everything for now. Per-person staff access
-- (Off / View / Edit per area) comes in build step 6.
-- Riders only see and change their own deliveries.

alter table public.business enable row level security;
alter table public.riders enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.day_openings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_moves enable row level security;
alter table public.expenses enable row level security;

create policy "signed in can read" on public.business for select to authenticated using (public.my_role() is not null);
create policy "admin changes" on public.business for update to authenticated using (public.my_role() = 'admin');

create policy "office reads, rider reads own" on public.riders for select to authenticated
  using (public.my_role() in ('admin', 'staff') or id = public.my_rider_id());
create policy "admin changes" on public.riders for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

create policy "own profile or office" on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() in ('admin', 'staff'));
create policy "admin changes" on public.profiles for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

create policy "signed in can read" on public.products for select to authenticated using (public.my_role() is not null);
create policy "office changes" on public.products for insert to authenticated with check (public.my_role() in ('admin', 'staff'));
create policy "office updates" on public.products for update to authenticated using (public.my_role() in ('admin', 'staff'));

create policy "office" on public.day_openings for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));

create policy "office" on public.orders for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));
create policy "rider reads own" on public.orders for select to authenticated using (rider_id = public.my_rider_id());
create policy "rider updates own" on public.orders for update to authenticated
  using (rider_id = public.my_rider_id()) with check (rider_id = public.my_rider_id());

create policy "office" on public.order_items for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));
create policy "rider reads own" on public.order_items for select to authenticated using (rider_id = public.my_rider_id());

create policy "office" on public.stock_moves for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));
-- A rider's confirmed delivery takes the goods out of stock.
create policy "rider records own deliveries" on public.stock_moves for insert to authenticated
  with check (
    kind = 'delivered'
    and exists (select 1 from public.orders o where o.id = order_id and o.rider_id = public.my_rider_id())
  );

create policy "office" on public.expenses for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));

-- --------------------------------------------------------------- PowerSync
-- PowerSync reads changes from this publication to keep every phone up to date.
create publication powersync for table
  public.business, public.riders, public.profiles, public.products, public.day_openings,
  public.orders, public.order_items, public.stock_moves, public.expenses;
