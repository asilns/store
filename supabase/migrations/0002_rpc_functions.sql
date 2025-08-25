-- Additional RPC functions for enhanced functionality

-- Function to get store orders KPI for dashboard
create or replace function public.get_store_orders_kpi(
  input_store_id uuid,
  days integer
)
returns json language plpgsql security definer as $$
declare
  result json;
  start_date date;
begin
  start_date := current_date - days;
  
  select json_build_object(
    'orders_count', count(o.id),
    'total_gmv', coalesce(sum(oi.price_cents), 0),
    'total_profit', coalesce(sum(oi.profit_cents), 0),
    'total_commission', coalesce(sum(oi.commission_cents), 0),
    'avg_order_value', case 
      when count(o.id) > 0 then coalesce(sum(oi.price_cents) / count(o.id), 0)
      else 0
    end
  ) into result
  from public.orders o
  left join public.order_items oi on o.id = oi.order_id
  where o.store_id = input_store_id
    and o.created_at >= start_date;
  
  return result;
end;
$$;

-- Function to get comprehensive store metrics
create or replace function public.get_store_comprehensive_metrics(
  input_store_id uuid
)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'products_count', (
      select count(*) from public.products 
      where store_id = input_store_id
    ),
    'users_count', (
      select count(*) from public.user_store_map 
      where store_id = input_store_id
    ),
    'orders_30d', (
      select count(*) from public.orders 
      where store_id = input_store_id 
        and created_at >= current_date - interval '30 days'
    ),
    'gmv_30d', (
      select coalesce(sum(oi.price_cents), 0)
      from public.orders o
      left join public.order_items oi on o.id = oi.order_id
      where o.store_id = input_store_id 
        and o.created_at >= current_date - interval '30 days'
    ),
    'profit_30d', (
      select coalesce(sum(oi.profit_cents), 0)
      from public.orders o
      left join public.order_items oi on o.id = oi.order_id
      where o.store_id = input_store_id 
        and o.created_at >= current_date - interval '30 days'
    ),
    'commission_total_30d', (
      select coalesce(sum(oi.commission_cents), 0)
      from public.orders o
      left join public.order_items oi on o.id = oi.order_id
      where o.store_id = input_store_id 
        and o.created_at >= current_date - interval '30 days'
    ),
    'top_products', (
      select json_agg(json_build_object(
        'product_id', p.id,
        'product_name', p.name,
        'total_quantity', sum(oi.quantity),
        'total_revenue', sum(oi.price_cents)
      ))
      from public.order_items oi
      join public.orders o on oi.order_id = o.id
      join public.products p on oi.product_id = p.id
      where o.store_id = input_store_id 
        and o.created_at >= current_date - interval '30 days'
      group by p.id, p.name
      order by sum(oi.quantity) desc
      limit 5
    )
  ) into result;
  
  return result;
end;
$$;

-- Function to calculate order totals with financials
create or replace function public.calculate_order_financials(
  order_items_data jsonb
)
returns json language plpgsql security definer as $$
declare
  result json;
  total_price_cents integer := 0;
  total_cost_cents integer := 0;
  total_commission_cents integer := 0;
  total_profit_cents integer := 0;
  item record;
begin
  for item in select * from jsonb_array_elements(order_items_data)
  loop
    total_price_cents := total_price_cents + (item->>'price_cents')::integer;
    total_cost_cents := total_cost_cents + (item->>'unit_cost_cents')::integer * (item->>'quantity')::integer;
    total_commission_cents := total_commission_cents + (item->>'commission_cents')::integer;
  end loop;
  
  total_profit_cents := total_price_cents - total_cost_cents - total_commission_cents;
  
  result := json_build_object(
    'total_price_cents', total_price_cents,
    'total_cost_cents', total_cost_cents,
    'total_commission_cents', total_commission_cents,
    'total_profit_cents', total_profit_cents
  );
  
  return result;
end;
$$;

-- Function to get user's store memberships with store details
create or replace function public.get_user_store_memberships(
  user_uuid uuid
)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_agg(json_build_object(
    'store_id', usm.store_id,
    'role', usm.role,
    'store_name', s.name,
    'store_suspended', s.is_suspended,
    'store_created', s.created_at
  )) into result
  from public.user_store_map usm
  join public.stores s on usm.store_id = s.id
  where usm.user_id = user_uuid;
  
  return coalesce(result, '[]'::json);
end;
$$;

-- Function to validate product SKU uniqueness per store
create or replace function public.validate_product_sku(
  input_store_id uuid,
  input_sku text,
  exclude_product_id uuid default null
)
returns boolean language plpgsql security definer as $$
declare
  existing_count integer;
begin
  if exclude_product_id is not null then
    select count(*) into existing_count
    from public.products
    where store_id = input_store_id 
      and sku = input_sku 
      and id != exclude_product_id;
  else
    select count(*) into existing_count
    from public.products
    where store_id = input_store_id 
      and sku = input_sku;
  end if;
  
  return existing_count = 0;
end;
$$;
