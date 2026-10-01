-- Our own sync: lets each phone ask "what changed since I last looked?" and "what was deleted?".
-- Run in the Supabase SQL editor after the earlier migration files.

-- ------------------------------------------------------------ "changed at" times

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'business', 'riders', 'profiles', 'products', 'day_openings', 'orders', 'order_items',
    'stock_moves', 'expenses', 'customers', 'staff', 'staff_roles', 'sync_clashes'
  ] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format('create index if not exists %I on public.%I (updated_at)', t || '_updated_at_idx', t);
    execute format('create trigger touch_updated_at before insert or update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ------------------------------------------------------------ deleted rows

-- Phones cannot ask for rows that no longer exist, so every delete is written down here.
create table public.sync_deletes (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  at timestamptz not null default now()
);

alter table public.sync_deletes enable row level security;
create policy "signed in can read" on public.sync_deletes for select to authenticated
  using (public.my_role() is not null);

create function public.note_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.sync_deletes (table_name, row_id) values (tg_table_name, old.id::text);
  return old;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'business', 'riders', 'profiles', 'products', 'day_openings', 'orders', 'order_items',
    'stock_moves', 'expenses', 'customers', 'staff', 'staff_roles', 'sync_clashes'
  ] loop
    execute format('create trigger note_delete after delete on public.%I for each row execute function public.note_delete()', t);
  end loop;
end $$;
