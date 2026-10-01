-- Staff access: roles, per-person changes, and the server checking them.
-- Areas: stock, sales, customers, riders, expenses, staffpay, finance, reports, settings.
-- Levels: off (hidden), view (look only), edit (add and change).
-- Extra permissions: seeCost, closeDay, exportReports.

create table public.staff_roles (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  summary text not null default '',
  -- {"areas": {...}, "perms": {...}} as JSON text.
  access text not null
);

insert into public.staff_roles (id, name, summary, access) values
  ('manager', 'Manager', 'Runs daily operations: stock, sales, customers and riders.',
   '{"areas":{"stock":"edit","sales":"edit","customers":"edit","riders":"edit","expenses":"view","staffpay":"off","finance":"off","reports":"edit","settings":"off"},"perms":{"seeCost":false,"closeDay":false,"exportReports":true}}'),
  ('accounts', 'Accounts', 'Handles money: expenses, staff pay, finance and reports.',
   '{"areas":{"stock":"off","sales":"view","customers":"off","riders":"off","expenses":"edit","staffpay":"edit","finance":"view","reports":"edit","settings":"off"},"perms":{"seeCost":true,"closeDay":false,"exportReports":true}}'),
  ('storekeeper', 'Store keeper', 'Receives and counts stock. Sees sales so they can pack orders.',
   '{"areas":{"stock":"edit","sales":"view","customers":"off","riders":"off","expenses":"off","staffpay":"off","finance":"off","reports":"off","settings":"off"},"perms":{"seeCost":false,"closeDay":false,"exportReports":false}}'),
  ('sales', 'Sales', 'Takes orders and looks after customers.',
   '{"areas":{"stock":"view","sales":"edit","customers":"edit","riders":"off","expenses":"off","staffpay":"off","finance":"off","reports":"off","settings":"off"},"perms":{"seeCost":false,"closeDay":false,"exportReports":false}}');

alter table public.staff
  add column role_id text references public.staff_roles (id),
  -- What Admin changed for this one person (JSON text).
  add column overrides text not null default '{}',
  -- The role plus this person's changes, worked out by the app on save.
  add column access text;

-- A staff member's sign-in account.
alter table public.profiles add column staff_id uuid references public.staff (id);

alter table public.staff_roles enable row level security;
create policy "office reads" on public.staff_roles for select to authenticated
  using (public.my_role() in ('admin', 'staff'));
create policy "admin changes" on public.staff_roles for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

alter publication powersync add table public.staff_roles;

-- ------------------------------------------------------------ access checks

create function public.my_access() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(s.access, '{}')::jsonb
  from public.profiles p join public.staff s on s.id = p.staff_id
  where p.id = auth.uid() and p.can_sign_in
$$;

-- Admin can change everything; staff only areas set to "edit".
create function public.can_edit(area text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() = 'admin'
    or (public.my_role() = 'staff' and public.my_access() -> 'areas' ->> area = 'edit')
$$;

create function public.can_do(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() = 'admin'
    or (public.my_role() = 'staff' and coalesce((public.my_access() -> 'perms' ->> perm)::boolean, false))
$$;

-- Replace "any office user can change it" with the person's access.
drop policy "office changes" on public.products;
drop policy "office updates" on public.products;
create policy "stock editors add" on public.products for insert to authenticated with check (public.can_edit('stock'));
create policy "stock editors change" on public.products for update to authenticated using (public.can_edit('stock'));

drop policy "office" on public.stock_moves;
create policy "office reads" on public.stock_moves for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "stock editors" on public.stock_moves for insert to authenticated with check (public.can_edit('stock'));
create policy "stock editors change" on public.stock_moves for update to authenticated using (public.can_edit('stock'));

drop policy "office" on public.orders;
create policy "office reads" on public.orders for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "sales editors" on public.orders for insert to authenticated with check (public.can_edit('sales'));
create policy "sales editors change" on public.orders for update to authenticated using (public.can_edit('sales'));

drop policy "office" on public.order_items;
create policy "office reads" on public.order_items for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "sales editors" on public.order_items for insert to authenticated with check (public.can_edit('sales'));
create policy "sales editors change" on public.order_items for update to authenticated using (public.can_edit('sales'));

-- A new sale can add a new customer, so sales editors can add customers too.
drop policy "office" on public.customers;
create policy "office reads" on public.customers for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "customer or sales editors" on public.customers for insert to authenticated
  with check (public.can_edit('customers') or public.can_edit('sales'));
create policy "customer editors change" on public.customers for update to authenticated using (public.can_edit('customers'));

-- Paying someone needs Staff & pay; any other expense needs Expenses.
drop policy "office" on public.expenses;
create policy "office reads" on public.expenses for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "expense editors" on public.expenses for insert to authenticated
  with check (case when payee is null then public.can_edit('expenses') else public.can_edit('staffpay') end);

drop policy "admin changes" on public.riders;
create policy "rider editors" on public.riders for all to authenticated
  using (public.can_edit('riders')) with check (public.can_edit('riders'));

-- The staff table itself (pay and access) stays Admin-only.

-- Closing the day: opening stock for tomorrow and moving the business day.
drop policy "office" on public.day_openings;
create policy "office reads" on public.day_openings for select to authenticated using (public.my_role() in ('admin', 'staff'));
create policy "day closers" on public.day_openings for all to authenticated
  using (public.can_do('closeDay')) with check (public.can_do('closeDay'));

drop policy "admin changes" on public.business;
create policy "day closers or settings editors" on public.business for update to authenticated
  using (public.can_do('closeDay') or public.can_edit('settings'));

-- Moving the day needs Close the day; changing settings needs Business settings: edit.
create function public.business_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit('settings') and (new.name is distinct from old.name or new.require_photo is distinct from old.require_photo) then
    raise exception 'No access to business settings' using errcode = '42501';
  end if;
  if not public.can_do('closeDay') and new.current_day is distinct from old.current_day then
    raise exception 'No access to close the day' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger business_guard before update on public.business for each row execute function public.business_guard();
