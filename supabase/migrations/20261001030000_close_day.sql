-- Closing the day.
-- Run in the Supabase SQL editor after the earlier migration files.
--
-- When Admin closes a day, the app writes each product's closing stock into
-- day_openings for the next day and moves business.current_day forward.
-- Deliveries record the business day they were done on, so each rider's
-- earnings land on the right day even when an order was taken earlier.

alter table public.orders add column delivered_day date;

update public.orders set delivered_day = coalesce(delivered_at::date, day) where status = 'delivered';
