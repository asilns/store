-- Fix infinite recursion in user_store_map policy

-- Drop the problematic policy first
drop policy if exists user_store_map_manage on public.user_store_map;

-- Recreate the policy with a fixed approach that avoids infinite recursion
create policy if not exists user_store_map_manage on public.user_store_map 
for all 
using (
  exists (
    select 1 from public.user_store_map m 
    where m.store_id = store_id 
    and m.user_id = auth.uid() 
    and m.role in ('owner', 'admin')
  )
) 
with check (
  -- For insert operations, check if the current user has admin/owner role in the target store
  (auth.uid() = user_id) OR (
    exists (
      select 1 from public.user_store_map m 
      where m.store_id = store_id 
      and m.user_id = auth.uid() 
      and m.role in ('owner', 'admin')
    )
  )
);
