-- What the rider is paid for one delivery. Empty means "the rider's usual rate".
alter table public.orders add column if not exists rider_pay integer;
