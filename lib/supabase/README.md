# Supabase Server Client

This directory contains the server-side Supabase client implementation for the multi-tenant orders dashboard.

## Overview

The server client provides secure, authenticated access to Supabase operations with built-in user permission checks and store isolation. All CRUD operations are performed using the logged-in user's credentials and respect multi-tenant boundaries.

## Key Features

- **User Authentication**: Automatic user authentication from server-side requests
- **Role-Based Access Control**: Operations respect user roles (owner, admin, manager, staff, viewer)
- **Store Isolation**: All operations are scoped to the user's authorized stores
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Consistent error handling across all operations

## Usage

### Basic Setup

```typescript
import {
  getCurrentUser,
  getProducts,
  createProduct,
} from "@/lib/supabase/server";

// In your API route or server component
export async function GET(request: NextRequest) {
  // Get current authenticated user
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use user.id for all operations
  const { data: products, error: productsError } = await getProducts(
    storeId,
    user.id
  );
}
```

### Authentication Functions

#### `getCurrentUser()`

Get the currently authenticated user from the server context.

```typescript
const { user, error } = await getCurrentUser();

if (user) {
  console.log("User ID:", user.id);
  console.log("User email:", user.email);
}
```

#### `getCurrentUserWithStores()`

Get the current user along with all their associated stores and roles.

```typescript
const { user, stores, error } = await getCurrentUserWithStores();

if (user && stores) {
  stores.forEach((storeAccess) => {
    console.log(`Store: ${storeAccess.stores.name}, Role: ${storeAccess.role}`);
  });
}
```

### Store Operations

#### `getUserStores(userId: string)`

Get all stores a user has access to.

#### `getStoreById(storeId: string, userId: string)`

Get a specific store if the user has access to it.

### Product Operations

#### `getProducts(storeId: string, userId: string)`

Get all products for a store (requires store access).

#### `createProduct(productData: ProductData, storeId: string, userId: string)`

Create a new product (requires owner/admin/manager role).

#### `updateProduct(productId: string, updates: Partial<ProductData>, storeId: string, userId: string)`

Update a product (requires owner/admin/manager role).

#### `deleteProduct(productId: string, storeId: string, userId: string)`

Delete a product (requires owner/admin role).

### Order Operations

#### `getOrders(storeId: string, userId: string)`

Get all orders for a store with order items and product details.

#### `createOrder(orderData: OrderData, storeId: string, userId: string)`

Create a new order (requires owner/admin/manager role).

#### `updateOrder(orderId: string, updates: Partial<OrderData>, storeId: string, userId: string)`

Update an order (requires owner/admin/manager role).

#### `deleteOrder(orderId: string, storeId: string, userId: string)`

Delete an order (requires owner/admin role).

### Utility Functions

#### `checkUserRole(userId: string, storeId: string, requiredRoles: string[])`

Check if a user has a specific role in a store.

```typescript
const { hasRole, role } = await checkUserRole(userId, storeId, [
  "owner",
  "admin",
]);

if (hasRole) {
  console.log(`User has role: ${role}`);
}
```

## Role-Based Permissions

| Role        | Products      | Orders        | Invoices | Subscriptions |
| ----------- | ------------- | ------------- | -------- | ------------- |
| **owner**   | Full CRUD     | Full CRUD     | View     | View          |
| **admin**   | Full CRUD     | Full CRUD     | View     | View          |
| **manager** | Create/Update | Create/Update | -        | -             |
| **staff**   | View          | View          | -        | -             |
| **viewer**  | View          | View          | -        | -             |

## Security Features

1. **User Authentication**: All operations require a valid authenticated user
2. **Store Isolation**: Users can only access data from stores they're authorized for
3. **Role Validation**: Operations check user roles before allowing actions
4. **Input Validation**: Store IDs and user IDs are validated on every operation
5. **Error Handling**: Consistent error responses for unauthorized access

## Example API Route

See `app/api/products/route.ts` for a complete example of how to use the server client in an API route.

## Error Handling

All functions return objects with `data` and `error` properties:

```typescript
const { data, error } = await getProducts(storeId, userId);

if (error) {
  if (error.message === "Access denied") {
    // Handle unauthorized access
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  // Handle other errors
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

// Use data safely
return NextResponse.json({ products: data });
```

## Best Practices

1. **Always check authentication first** using `getCurrentUser()`
2. **Validate store access** before performing operations
3. **Handle errors gracefully** with appropriate HTTP status codes
4. **Use TypeScript interfaces** for type safety
5. **Log errors appropriately** for debugging
6. **Return consistent response formats** across all endpoints

## Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
