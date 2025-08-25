-- Add missing fields to stores table to match expected schema
-- This migration adds plan, status, and updated_at fields

-- Add plan field with enum constraint (if not already added by 0005)
DO $$ BEGIN
    CREATE TYPE public.store_plan AS ENUM ('basic', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan public.store_plan NOT NULL DEFAULT 'basic';

-- Add status field with enum constraint (if not already added by 0005)
DO $$ BEGIN
    CREATE TYPE public.store_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status public.store_status NOT NULL DEFAULT 'active';

-- Add updated_at field
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_stores_set_updated_at ON public.stores;
CREATE TRIGGER trg_stores_set_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update existing stores to have default values
UPDATE public.stores SET 
    plan = 'basic' WHERE plan IS NULL,
    status = 'active' WHERE status IS NULL,
    updated_at = created_at WHERE updated_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_plan ON public.stores(plan);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_updated_at ON public.stores(updated_at);
