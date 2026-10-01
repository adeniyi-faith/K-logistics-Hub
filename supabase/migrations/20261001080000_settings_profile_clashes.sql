-- Step 7: full business settings, riders changing their own details, and sync clashes.
-- Run in the Supabase SQL editor after the earlier migration files.

-- ------------------------------------------------------------ business settings

-- Logo, lists (expense categories, product groups, units, delivery areas), stock rules and
-- the business's own words, as JSON text (see app/src/data/settings.ts).
-- The logo is a file in the "delivery-photos" storage folder, e.g. "logo-<id>.jpg".
alter table public.business add column settings text not null default '{}';

-- Changing settings needs Business settings: edit; moving the day needs Close the day.
create or replace function public.business_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit('settings') and (
    new.name is distinct from old.name
    or new.require_photo is distinct from old.require_photo
    or new.settings is distinct from old.settings
  ) then
    raise exception 'No access to business settings' using errcode = '42501';
  end if;
  if not public.can_do('closeDay') and new.current_day is distinct from old.current_day then
    raise exception 'No access to close the day' using errcode = '42501';
  end if;
  return new;
end $$;

-- ------------------------------------------------------------ riders' own details

alter table public.riders
  add column phone2 text,
  add column kin_name text,
  add column kin_phone text,
  add column kin_relation text,
  -- Where to pay them.
  add column pay_bank text,
  add column pay_account text,
  add column pay_name text,
  -- The business day the rider last changed where to pay them (set by the server).
  add column pay_changed text,
  -- Their photo, in the "delivery-photos" storage folder.
  add column photo_path text,
  -- Something the rider asked Admin to change (name, ID or bike), and the day they asked.
  add column change_request text,
  add column change_request_at text;

-- A rider can change their own row...
create policy "rider changes own details" on public.riders for update to authenticated
  using (public.my_role() = 'rider' and id = public.my_rider_id())
  with check (public.my_role() = 'rider' and id = public.my_rider_id());

-- ...but not what Admin checks: name, ID, bike, pay rate and status.
create function public.rider_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'rider' then
    if new.name is distinct from old.name
      or new.initials is distinct from old.initials
      or new.bike is distinct from old.bike
      or new.bike_model is distinct from old.bike_model
      or new.bike_colour is distinct from old.bike_colour
      or new.rate_per_delivery is distinct from old.rate_per_delivery
      or new.status is distinct from old.status
      or new.status_since is distinct from old.status_since
      or new.id_type is distinct from old.id_type
      or new.id_number is distinct from old.id_number
      or new.joined is distinct from old.joined
    then
      raise exception 'Only Admin can change this' using errcode = '42501';
    end if;
    -- Admin gets a notice when a rider changes where to pay them.
    new.pay_changed := old.pay_changed;
    if old.pay_account is not null and (
      new.pay_account is distinct from old.pay_account or new.pay_bank is distinct from old.pay_bank
    ) then
      new.pay_changed := (select current_day::text from public.business limit 1);
    end if;
  end if;
  return new;
end $$;

create trigger rider_guard before update on public.riders for each row execute function public.rider_guard();

-- ------------------------------------------------------------ sync clashes

-- When two phones change the same thing while one is offline, the value that arrived first
-- stays and the other is written down here for Admin to pick from (Sync centre).
create table public.sync_clashes (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id text not null,
  field text not null,
  -- The value from the phone that uploaded later, and who saved it.
  mine jsonb,
  mine_by text not null default '',
  -- The value already in use when it arrived.
  theirs jsonb,
  at text not null default to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  resolved boolean not null default false
);

alter table public.sync_clashes enable row level security;
create policy "signed in can record" on public.sync_clashes for insert to authenticated
  with check (public.my_role() is not null);
create policy "admin reads" on public.sync_clashes for select to authenticated using (public.my_role() = 'admin');
create policy "admin decides" on public.sync_clashes for update to authenticated using (public.my_role() = 'admin');

-- Who saved the other value comes from their account, not from what the phone says.
create function public.sync_clash_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.mine_by := coalesce((select name from public.profiles where id = auth.uid()), '');
  new.resolved := false;
  return new;
end $$;

create trigger sync_clash_guard before insert on public.sync_clashes for each row execute function public.sync_clash_guard();

alter publication powersync add table public.sync_clashes;

-- The app sends each change to an existing record here, with the values the phone had
-- before the change (p_old). Each changed column is saved unless someone else changed it
-- meanwhile; then it becomes a clash instead. Runs with the caller's own access rules.
create function public.save_change(p_table text, p_id text, p_new jsonb, p_old jsonb, p_by text default '')
returns void
language plpgsql security invoker set search_path = public as $$
declare
  cur jsonb;
  new_n jsonb;
  old_n jsonb;
  k text;
  keep jsonb := '{}';
  cols text;
begin
  if p_table not in ('business', 'riders', 'staff', 'staff_roles', 'products', 'customers') then
    raise exception 'Not a table that can be changed this way' using errcode = '42501';
  end if;

  execute format('select to_jsonb(t) from public.%I t where id::text = $1 for update', p_table) into cur using p_id;
  if cur is null then
    return; -- Gone, or not this person's to see.
  end if;

  -- Read both sets of values the way the table stores them (e.g. 1 -> true for yes/no columns).
  execute format(
    'select to_jsonb(jsonb_populate_record(null::public.%1$I, $1)), to_jsonb(jsonb_populate_record(null::public.%1$I, $2))',
    p_table
  ) into new_n, old_n using p_new, coalesce(p_old, '{}');

  for k in select jsonb_object_keys(p_new) loop
    continue when k = 'id' or not cur ? k;
    if p_old ? k and (cur -> k) is distinct from (old_n -> k) and (cur -> k) is distinct from (new_n -> k) then
      insert into public.sync_clashes (table_name, row_id, field, mine, mine_by, theirs)
      values (p_table, p_id, k, new_n -> k, coalesce(p_by, ''), cur -> k);
    else
      keep := keep || jsonb_build_object(k, p_new -> k);
    end if;
  end loop;

  if keep = '{}' then
    return;
  end if;
  select string_agg(format('%1$I = r.%1$I', x), ', ') into cols from jsonb_object_keys(keep) x;
  execute format(
    'update public.%1$I t set %2$s from jsonb_populate_record(null::public.%1$I, $1) r where t.id::text = $2',
    p_table, cols
  ) using keep, p_id;
end $$;

grant execute on function public.save_change(text, text, jsonb, jsonb, text) to authenticated;
