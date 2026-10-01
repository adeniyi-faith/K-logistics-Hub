-- Delivery photo, with an Admin switch to turn it on or off.
-- Run in the Supabase SQL editor after the earlier migration files.

alter table public.business add column require_photo boolean not null default false;

-- The photo's file name in the "delivery-photos" storage bucket, e.g. "<order id>.jpg".
alter table public.orders add column photo_path text;

-- Private bucket for the photos: only signed-in people can upload or view them.
insert into storage.buckets (id, name, public) values ('delivery-photos', 'delivery-photos', false)
on conflict (id) do nothing;

create policy "signed in can add delivery photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'delivery-photos' and public.my_role() is not null);
create policy "signed in can replace delivery photos" on storage.objects for update to authenticated
  using (bucket_id = 'delivery-photos' and public.my_role() is not null);
create policy "signed in can view delivery photos" on storage.objects for select to authenticated
  using (bucket_id = 'delivery-photos' and public.my_role() is not null);
