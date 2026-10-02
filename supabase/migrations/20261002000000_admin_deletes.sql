-- Admin can delete records from the app: a sale, an expense, a stock entry, a customer or a product,
-- and "Clear old data" in Business settings. Riders, staff and opening stock could already be deleted.
-- Also lets riders read their own delivery stock records (see the end). Run in the Supabase SQL editor.

create policy "admin deletes" on public.orders for delete to authenticated using (public.my_role() = 'admin');
create policy "admin deletes" on public.order_items for delete to authenticated using (public.my_role() = 'admin');
create policy "admin deletes" on public.stock_moves for delete to authenticated using (public.my_role() = 'admin');
create policy "admin deletes" on public.products for delete to authenticated using (public.my_role() = 'admin');
create policy "admin deletes" on public.customers for delete to authenticated using (public.my_role() = 'admin');
create policy "admin deletes" on public.expenses for delete to authenticated using (public.my_role() = 'admin');

-- A deleted customer's past sales keep the name and phone copied onto them; only the link goes.
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.customers (id) on delete set null;

-- Fix: phones upload new rows as an "upsert", which Postgres only allows when the person may also read
-- the row. Riders could add the stock record for a delivery they confirmed but not read it, so the
-- server refused it and stock never went down after a rider's delivery. Riders may now read their own.
create policy "rider reads own deliveries" on public.stock_moves for select to authenticated
  using (
    kind = 'delivered'
    and exists (select 1 from public.orders o where o.id = order_id and o.rider_id = public.my_rider_id())
  );
