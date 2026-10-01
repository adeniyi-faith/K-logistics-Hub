-- Expenses: how often each one comes up, which bike it was for, and who wrote it down.
alter table public.expenses
  add column frequency text not null default 'one_time' check (frequency in ('daily', 'weekly', 'monthly', 'one_time')),
  add column bike text,
  add column at timestamptz not null default now(),
  add column by_name text not null default '',
  add column created_by uuid default auth.uid();

create index on public.expenses (day);
