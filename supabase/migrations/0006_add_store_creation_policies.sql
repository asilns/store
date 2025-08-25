-- Add RLS policies for store creation

-- Allow authenticated users to create stores
create policy if not exists stores_insert on public.stores 
for insert 
to authenticated 
with check (true);

-- Allow authenticated users to update stores they own/admin
create policy if not exists stores_update on public.stores 
for update 
using (
  exists (
    select 1 from public.user_store_map m 
    where m.store_id = id 
    and m.user_id = auth.uid() 
    and m.role in ('owner', 'admin')
  )
);

-- Allow authenticated users to delete stores they own
create policy if not exists stores_delete on public.stores 
for delete 
using (
  exists (
    select 1 from public.user_store_map m 
    where m.store_id = id 
    and m.user_id = auth.uid() 
    and m.role = 'owner'
  )
);

-- Allow authenticated users to insert themselves into user_store_map when creating stores
create policy if not exists user_store_map_insert on public.user_store_map 
for insert 
to authenticated 
with check (user_id = auth.uid());

-- Allow store owners/admins to manage other users in their stores
-- Fixed to avoid infinite recursion by using a more direct approach
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
