-- Starting data: the business row and the 27 products from the design.
-- Prices are placeholders (cost ₦14,000, selling ₦21,500): change each one
-- in the app (Stock → product → Edit prices). Opening stock is sample data;
-- set the real counts before going live.

insert into public.business (name, current_day) values ('K-Logistics Hub', current_date);

with p (name, product_group, unit, pack, opening) as (values
  ('Mullein herbal tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 40),
  ('Orafix Power Duo', 'Oral care', 'pack', 'Pack of 2', 36),
  ('Fibnova', 'Capsules', 'pack', 'Pack of 60 capsules', 30),
  ('Sabana Pro', 'Capsules', 'bottle', 'Bottle of 60 capsules', 25),
  ('Kidney Support tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 22),
  ('Prostdesx', 'Men''s health', 'bottle', 'Bottle of 60 capsules', 18),
  ('5 Vitamin C', 'Capsules', 'bottle', 'Bottle of 60 tablets', 12),
  ('Glow Serum', 'Skin care', 'bottle', 'Bottle, 30 ml', 6),
  ('Kojic Acid', 'Skin care', 'bar', 'Soap bar', 9),
  ('Baysel', 'Capsules', 'bottle', 'Bottle of 60 capsules', 20),
  ('Boazem', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  ('Cazibin', 'Capsules', 'bottle', 'Bottle of 60 capsules', 14),
  ('Dark Spot', 'Skin care', 'tube', 'Cream, 50 g', 18),
  ('Devano', 'Capsules', 'bottle', 'Bottle of 60 capsules', 21),
  ('Facial Soap', 'Skin care', 'bar', 'Soap bar', 30),
  ('Hair Plus Formula', 'Hair care', 'bottle', 'Bottle, 100 ml', 15),
  ('Menopause Support', 'Women''s health', 'bottle', 'Bottle of 60 capsules', 17),
  ('Mvera', 'Capsules', 'bottle', 'Bottle, 500 ml', 19),
  ('Proxan', 'Men''s health', 'bottle', 'Bottle of 60 capsules', 13),
  ('Sootra', 'Capsules', 'bottle', 'Bottle of 60 capsules', 24),
  ('Soluvia', 'Women''s health', 'bottle', 'Bottle of 60 capsules', 15),
  ('Sovana', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  ('Swanky', 'Men''s health', 'bottle', 'Bottle of 60 capsules', 20),
  ('Visura', 'Capsules', 'bottle', 'Bottle of 60 capsules', 18),
  ('Zouwa', 'Capsules', 'bottle', 'Bottle of 60 capsules', 14),
  ('Zudes Capsule', 'Capsules', 'bottle', 'Bottle of 60 capsules', 16),
  ('Zemora Tea', 'Herbal teas', 'box', 'Box of 20 tea bags', 19)
), ins as (
  insert into public.products (name, product_group, unit, pack, cost_price, sell_price, low_at, supplier)
  select name, product_group, unit, pack, 14000, 21500, 10, 'Bioharb' from p
  returning id, name
)
insert into public.day_openings (day, product_id, opening)
select current_date, ins.id, p.opening from ins join p using (name);
