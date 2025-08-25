-- Add owner_id field to stores table
-- This field will reference the user who owns the store

-- Add owner_id column with foreign key constraint
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Make owner_id NOT NULL for new stores (existing stores will have NULL)
-- We'll update existing stores to have an owner based on user_store_map
UPDATE public.stores s 
SET owner_id = (
  SELECT usm.user_id 
  FROM public.user_store_map usm 
  WHERE usm.store_id = s.id AND usm.role = 'owner' 
  LIMIT 1
);

-- Now make owner_id NOT NULL
ALTER TABLE public.stores ALTER COLUMN owner_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);

-- Update RLS policies to include owner_id check
DROP POLICY IF EXISTS stores_select ON public.stores;
CREATE POLICY stores_select ON public.stores FOR SELECT USING (
  public.is_member_of_store(auth.uid(), id) OR owner_id = auth.uid()
);

-- Update insert policy to ensure owner_id is set
DROP POLICY IF EXISTS stores_insert ON public.stores;
CREATE POLICY stores_insert ON public.stores FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

-- Update update policy to allow owners to update their stores
DROP POLICY IF EXISTS stores_update ON public.stores;
CREATE POLICY stores_update ON public.stores FOR UPDATE 
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_store_map m 
    WHERE m.store_id = id 
    AND m.user_id = auth.uid() 
    AND m.role IN ('owner', 'admin')
  )
);

-- Update delete policy to only allow owners to delete
DROP POLICY IF EXISTS stores_delete ON public.stores;
CREATE POLICY stores_delete ON public.stores FOR DELETE 
USING (owner_id = auth.uid());
