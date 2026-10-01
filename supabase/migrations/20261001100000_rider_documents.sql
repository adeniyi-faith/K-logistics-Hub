-- Riders can upload photos of their papers (driver's licence, ID, bike papers...).
-- A JSON list of { id, kind, photo, day }; each photo is a file in the "delivery-photos" storage folder.
-- Riders may change this themselves (rider_guard only blocks name, ID, bike, pay rate and status).
alter table public.riders add column documents text not null default '[]';

-- Sales can be saved without a customer when the business turns off customer details
-- (Business settings). customer_id is already optional; the customer name is then empty.
