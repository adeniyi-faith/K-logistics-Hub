-- Fixing sales, counting stock, editing expenses, unique order numbers and tighter photo rules.
-- Run in the Supabase SQL editor after the earlier migration files, before installing the matching app build.

-- ------------------------------------------------------------ stock count changes

-- "added" / "removed": damage, a return or a recount, with the reason in note.
alter table public.stock_moves drop constraint if exists stock_moves_kind_check;
alter table public.stock_moves add constraint stock_moves_kind_check
  check (kind in ('received', 'delivered', 'added', 'removed'));
alter table public.stock_moves add column if not exists note text;

-- ------------------------------------------------------------ sales

-- Editing a sale can take a line off it.
create policy "sales editors remove items" on public.order_items for delete to authenticated
  using (public.can_edit('sales'));

-- Admin and staff who handle sales can mark an order delivered (e.g. the rider's phone is dead),
-- which takes the goods out of stock.
create policy "sales editors record deliveries" on public.stock_moves for insert to authenticated
  with check (kind = 'delivered' and public.can_edit('sales'));

-- Two phones that were offline can both make the same order number. The second one to arrive
-- gets a short ending added, e.g. "S-1002-18" becomes "S-1002-18-A3F".
create function public.unique_order_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.orders where code = new.code and id <> new.id) then
    new.code := new.code || '-' || upper(substr(md5(new.id::text), 1, 3));
  end if;
  return new;
end $$;

create trigger unique_order_code before insert on public.orders
  for each row execute function public.unique_order_code();

-- ------------------------------------------------------------ expenses

-- Fixing an expense or payment needs the same access as writing one down.
create policy "expense editors change" on public.expenses for update to authenticated
  using (case when payee is null then public.can_edit('expenses') else public.can_edit('staffpay') end)
  with check (case when payee is null then public.can_edit('expenses') else public.can_edit('staffpay') end);

-- ------------------------------------------------------------ photos

-- Before: anyone signed in could open any photo. Now Admin and staff see them all; riders see the
-- logo, their own photo and papers, and the photos of their own deliveries.
-- (Rider photos and papers are now saved with the rider's id in the name, e.g. "doc-<rider id>-....jpg".
-- A rider's photos saved before this can still be seen by Admin and staff.)
create function public.can_see_photo(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() in ('admin', 'staff')
    or name like 'logo-%'
    or (
      public.my_role() = 'rider' and (
        name like 'rider-' || public.my_rider_id()::text || '-%'
        or name like 'doc-' || public.my_rider_id()::text || '-%'
        or exists (select 1 from public.orders o where o.rider_id = public.my_rider_id() and o.id::text || '.jpg' = name)
      )
    )
$$;

drop policy "signed in can view delivery photos" on storage.objects;
create policy "people see the photos meant for them" on storage.objects for select to authenticated
  using (bucket_id = 'delivery-photos' and public.can_see_photo(name));

drop policy "signed in can replace delivery photos" on storage.objects;
create policy "people replace the photos meant for them" on storage.objects for update to authenticated
  using (bucket_id = 'delivery-photos' and public.can_see_photo(name));
