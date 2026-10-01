-- Customers, and who took each order.
-- Run in the Supabase SQL editor after 20261001000000_init.sql.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  area text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);

-- Orders keep a copy of the customer's name, phone and address so a rider's
-- phone can show them without downloading the whole customer list.
alter table public.orders
  add column customer_id uuid references public.customers (id),
  add column taken_by text not null default '';

create index on public.orders (customer_id);

alter table public.customers enable row level security;
create policy "office" on public.customers for all to authenticated
  using (public.my_role() in ('admin', 'staff')) with check (public.my_role() in ('admin', 'staff'));

alter publication powersync add table public.customers;
