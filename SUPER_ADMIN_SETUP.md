# Super Admin Setup Guide

This guide explains how to set up a super admin user for the multi-tenant orders dashboard.

## Overview

The system now includes a role-based access control system where only users with `super_admin` role can access the admin panel. This provides an additional security layer beyond regular authentication.

## Database Schema

The `users` table contains a `role` field that determines user privileges:

```sql
-- Users table structure
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text CHECK (role IN ('super_admin') OR role IS NULL),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- **`role = NULL`**: Regular store users (default)
- **`role = 'super_admin'`**: System administrators who manage the SaaS platform

## Setting Up the First Super Admin

### Step 1: Create a User Account

1. Sign up for a regular user account through the application
2. Note down the user ID (you can find this in the Supabase dashboard under `auth.users`)

### Step 2: Update User Role to Super Admin

1. Connect to your Supabase database
2. Run the following SQL command, replacing `your-user-id-here` with the actual UUID:

```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE id = 'your-user-id-here';
```

### Step 3: Verify Access

1. Try logging in through `/admin/login`
2. The system will now check your role and grant access if you're a super admin

## Security Features

- **Row Level Security (RLS)**: The `users` table is protected by RLS policies
- **Role Validation**: Only users with `super_admin` role can access admin functions
- **API Protection**: The `/api/admin/login` endpoint validates super admin privileges

## Adding More Super Admins

Once you have at least one super admin, you can add more through:

1. **Direct SQL**: Update the `role` field in the `users` table
2. **Admin Interface**: Build an interface for super admins to manage other super admins
3. **API Endpoints**: Create secure endpoints for role management

## Troubleshooting

### "Access denied. Super admin privileges required."

This error occurs when:

- The user doesn't have `role = 'super_admin'` in the `users` table
- The `users` table doesn't have a `role` field (run the migration first)

### "User ID mismatch"

This error occurs when:

- The authenticated user doesn't match the requested user ID
- There's a session/authentication issue

## Migration Files

- `0003_add_name_to_users.sql`: Adds the name field to users table
- `0007_add_missing_store_fields.sql`: Adds missing fields to stores table

## Next Steps

1. Run the database migration: `supabase db push`
2. Create your user account
3. Update your user role to super admin
4. Test admin access
5. Remove the hardcoded credentials from the login page

## Important Notes

- **No service role key needed**: The system uses only the anon key for authentication
- **Simple role system**: Super admin status is determined by a single field in the users table
- **Secure by default**: Regular users have no special privileges unless explicitly granted
