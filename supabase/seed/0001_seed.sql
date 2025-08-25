insert into public.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com')
on conflict (id) do nothing;

insert into public.users (id, email) values
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com')
on conflict (id) do nothing;

insert into public.stores (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alpha Store'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beta Store')
on conflict (id) do nothing;

insert into public.user_store_map (user_id, store_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'owner')
on conflict do nothing;

insert into public.products (store_id, name, sku, price_cents) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Product A1', 'A-001', 1000),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Product A2', 'A-002', 1500),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Product B1', 'B-001', 2000)
on conflict do nothing;

insert into public.orders (store_id, customer_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Customer B')
on conflict do nothing;

-- Example order items
with order_ids as (
  select id from public.orders limit 2
)
insert into public.order_items (order_id, product_id, quantity, price_cents, unit_cost_cents, commission_bps)
select o.id, p.id, 1, p.price_cents, (p.price_cents * 0.6)::int, 250
from order_ids o join public.products p on true
limit 2;


