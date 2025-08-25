# Authentication System Documentation

## Overview

This multi-tenant orders dashboard implements a dual authentication system that supports both regular store users and super admin users. The system is built on Supabase and provides secure, role-based access control.

## Architecture

### User Types

1. **Store Users**: Regular users who can create and manage stores, products, and orders
2. **Super Admins**: System administrators who manage the SaaS platform, store subscriptions, and billing

### Database Schema

- **`users`**: Basic user information (id, email, name, role)
  - `role`: NULL for store users, 'super_admin' for SaaS admins
- **`stores`**: Store information (id, name, plan, status)
- **`user_store_map`**: User-store relationships with roles (owner, admin, manager, staff, viewer)

## Authentication Flow

### Store User Authentication

1. **Signup**: User creates account via `/api/store` (PUT)
2. **Login**: User authenticates via `/api/store` (PATCH)
3. **Store Creation**: Authenticated user creates store via `/api/store` (POST)
4. **Access Control**: User can only access stores they're members of

### Super Admin Authentication

1. **Admin Login**: Super admin authenticates via `/api/admin/login`
2. **Role Verification**: System checks `users.role` field for 'super_admin' value
3. **Admin Access**: Super admin can access admin panel and manage platform

## API Endpoints

### Store Management & Authentication

- `GET /api/store` - Get user's stores
- `POST /api/store` - Create new store (store users only)
- `PUT /api/store` - User signup
- `PATCH /api/store` - User login

### Admin Authentication

- `POST /api/admin/login` - Authenticate super admin

## Security Features

### Row Level Security (RLS)

- Users can only access data from stores they're members of
- Super admin access is controlled via `users.role` field
- All database operations are protected by RLS policies

### Role-Based Access Control

- **Owner**: Full control over store
- **Admin**: Manage store settings and users
- **Manager**: Manage products and orders
- **Staff**: View and update orders
- **Viewer**: Read-only access

### API Protection

- All API routes require authentication
- Store creation is restricted to regular users (not super admins)
- Admin endpoints verify super admin privileges

## Implementation Details

### Server-Side Authentication

```typescript
import { createAuthenticatedApiClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { client, userId, error, isSuperAdmin } =
    await createAuthenticatedApiClient(request);

  if (error || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check super admin status if needed
  if (isSuperAdmin) {
    // Handle super admin logic
  }

  // Regular user logic
}
```

### Client-Side Authentication

```typescript
import { useAuth } from "@/lib/auth/AuthContext";

function MyComponent() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return <div>{isAdmin ? <AdminPanel /> : <StoreDashboard />}</div>;
}
```

## Usage Examples

### User Signup

```typescript
const response = await fetch("/api/store", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    name: "John Doe", 
    email: "john@example.com", 
    password: "password123" 
  }),
});

const { user } = await response.json();
```

### User Login

```typescript
const response = await fetch("/api/store", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    email: "john@example.com", 
    password: "password123" 
  }),
});

const { user } = await response.json();
```

### Creating a Store

```typescript
// Only authenticated store users can create stores
const response = await fetch("/api/store", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "My Store", plan: "basic" }),
});

const { store } = await response.json();
```

### Accessing User's Stores

```typescript
// Get stores where user is a member
const response = await fetch("/api/store");
const { stores } = await response.json();
```

## Setup Instructions

### 1. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the migrations in order:

```bash
supabase db push
```

### 3. Create Super Admin

1. Create a regular user account
2. Update user role to super admin:

```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE id = 'your-user-id';
```

## Security Considerations

1. **Always verify authentication** in API routes
2. **Use RLS policies** for database-level security
3. **Validate user permissions** before allowing operations
4. **Log authentication events** for security monitoring
5. **Check role-based access** for sensitive operations

## Troubleshooting

### Common Issues

1. **"User not authenticated"**: Check if user is logged in and session is valid
2. **"Access denied"**: Verify user has required role/permissions
3. **"Store creation failed"**: Ensure user is not a super admin
4. **Database errors**: Check if migrations have been applied

### Debug Steps

1. Check browser console for authentication errors
2. Verify environment variables are set correctly
3. Check Supabase dashboard for RLS policy issues
4. Verify database schema matches expected structure

## Future Enhancements

1. **Multi-factor authentication** for super admin accounts
2. **Session management** with configurable timeouts
3. **Audit logging** for all authentication events
4. **Role delegation** for temporary access grants
5. **Integration with external identity providers**
