# User Management Feature

This document describes the user management functionality implemented for the multi-tenant orders dashboard.

## Overview

The user management system allows store owners and admins to invite, manage, and remove users from their stores with different permission levels.

## Features

### User Roles

- **Owner**: Full control over store and users (can assign/remove any role)
- **Admin**: Manage store settings and users (can assign/remove non-owner roles)
- **Manager**: Manage orders and products
- **Staff**: Limited access to orders
- **Viewer**: Read-only access to store data

### User Management Operations

1. **Invite Users**: Add new users to the store by email and name
2. **Update Roles**: Change user roles within the store
3. **Remove Users**: Remove users from the store
4. **View Users**: See all users and their roles in a table format

## API Endpoints

### GET `/api/store/users?storeId={storeId}`

- **Purpose**: Fetch all users for a specific store
- **Permissions**: Owner, Admin
- **Response**: List of users with their roles and details

### POST `/api/store/users?storeId={storeId}`

- **Purpose**: Invite a new user to the store
- **Permissions**: Owner, Admin
- **Body**: `{ email, name, role }`
- **Response**: Success message and user details

### PUT `/api/store/users?storeId={storeId}`

- **Purpose**: Update a user's role
- **Permissions**: Owner, Admin
- **Body**: `{ userId, role }`
- **Response**: Success message

### DELETE `/api/store/users?storeId={storeId}`

- **Purpose**: Remove a user from the store
- **Permissions**: Owner, Admin
- **Body**: `{ userId }`
- **Response**: Success message

## Security Features

### Row Level Security (RLS)

- Users can only access data from stores they're members of
- All operations are protected by RLS policies

### Permission Checks

- Only owners and admins can manage users
- Owners cannot be removed by non-owners
- Users cannot remove themselves
- Role validation prevents invalid role assignments

### Input Validation

- Zod schemas validate all input data
- Email format validation
- Role enum validation
- UUID validation for user IDs

## Usage

### Accessing User Management

1. Navigate to `/settings` in your store
2. Click on the "User Management" tab
3. You'll see a table of current users and an "Add User" button

### Inviting a New User

1. Click "Add User" button
2. Fill in the user's email and name
3. Select the appropriate role
4. Click "Invite User"
5. The user will be added to the store

### Managing Existing Users

1. **Edit Role**: Click the edit icon next to a user to change their role
2. **Remove User**: Click the trash icon to remove a user from the store

## Database Schema

The user management system uses the following tables:

- `users`: Basic user information (id, email, name, created_at)
- `user_store_map`: User-store relationships with roles (user_id, store_id, role)

## Internationalization

The user management interface supports both English and Arabic languages with:

- Translated UI text
- RTL layout support for Arabic
- Localized date formatting

## Future Enhancements

- Email invitation system
- User acceptance flow
- Bulk user operations
- User activity logging
- Advanced permission granularity

## Troubleshooting

### Common Issues

1. **"Insufficient permissions"**: Only owners and admins can manage users
2. **"User already exists"**: Check if the email is already associated with the store
3. **"Cannot remove owner"**: Only store owners can remove other owners
4. **"Cannot remove yourself"**: Users cannot remove themselves from the store

### Debug Information

- Check browser console for detailed error messages
- Verify user role in the store
- Ensure store ID is correctly passed in API calls
- Check network tab for API response details
