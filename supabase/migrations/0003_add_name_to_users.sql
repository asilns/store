-- Add name field to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;

-- Update existing users to have a default name if they don't have one
UPDATE public.users SET name = 'User' WHERE name IS NULL;

-- Make name field required for future inserts
ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;
