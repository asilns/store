-- Add plan and status fields to stores table
-- According to TODO: stores: id, name, plan (basic, pro), status (active, inactive, suspended)

-- Add plan field with enum constraint
create type public.store_plan as enum ('basic', 'pro');
alter table public.stores add column if not exists plan public.store_plan not null default 'basic';

-- Add status field with enum constraint  
create type public.store_status as enum ('active', 'inactive', 'suspended');
alter table public.stores add column if not exists status public.store_status not null default 'active';

-- Update existing stores to have default values
update public.stores set 
  plan = 'basic' where plan is null,
  status = 'active' where status is null;

-- Add indexes for better performance
create index if not exists idx_stores_plan on public.stores(plan);
create index if not exists idx_stores_status on public.stores(status);

-- Update RLS policies to include new fields
-- (existing policies should work with new fields)
