-- Riders & bikes, Staff & pay, and receipt photos on expenses.

-- More about each rider. status: active (can be given deliveries), off_duty or bike_repair.
alter table public.riders
  add column status text not null default 'active' check (status in ('active', 'off_duty', 'bike_repair')),
  add column status_since date,
  add column address text,
  add column bike_model text,
  add column bike_colour text,
  add column id_type text,
  add column id_number text,
  add column joined date default current_date;

-- People on the payroll who are not riders (riders are paid per delivery).
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text not null default '',
  job text not null default '',
  phone text not null default '',
  pay integer not null default 0 check (pay >= 0),
  pay_every text not null default 'month' check (pay_every in ('month', 'week')),
  active boolean not null default true
);

alter table public.staff enable row level security;

create policy "office reads" on public.staff for select to authenticated
  using (public.my_role() in ('admin', 'staff'));
create policy "admin changes" on public.staff for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- Paying someone is written down as a "Staff pay" expense with who was paid.
-- receipt_path is the receipt photo's name in the delivery-photos storage folder.
alter table public.expenses
  add column payee uuid,
  add column receipt_path text;

alter publication powersync add table public.staff;
