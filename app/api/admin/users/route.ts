import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { mockCookies } from '@/lib/utils/mockCookies';

// Zod schemas for validation
const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['super_admin', 'owner', 'admin', 'manager', 'staff', 'viewer']).default('viewer'),
  store_id: z.string().optional(), // Required for non-super_admin users
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['super_admin', 'owner', 'admin', 'manager', 'staff', 'viewer']).optional(),
  store_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: mockCookies }
    );

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with their store mappings
    const { data: users, error } = await supabase
      .from('user_store_map')
      .select(`
        *,
        stores (
          id,
          name,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Group users by user_id and combine store mappings
    const userMap = new Map();
    users?.forEach((userMapping: any) => {
      const userId = userMapping.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: userId,
          email: userMapping.email,
          name: userMapping.name,
          stores: [],
          roles: [],
        });
      }
      
      const user = userMap.get(userId);
      user.stores.push({
        store_id: userMapping.store_id,
        store_name: userMapping.stores?.name || 'Unknown Store',
        store_status: userMapping.stores?.status || 'unknown',
        role: userMapping.role,
      });
      user.roles.push(userMapping.role);
    });

    const processedUsers = Array.from(userMap.values());

    return NextResponse.json({ users: processedUsers });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: mockCookies }
    );

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Validate store_id for non-super_admin users
    if (validatedData.role !== 'super_admin' && !validatedData.store_id) {
      return NextResponse.json({ error: 'Store ID is required for non-super_admin users' }, { status: 400 });
    }

    // Check if store exists (for non-super_admin users)
    if (validatedData.store_id) {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', validatedData.store_id)
        .single();

      if (storeError || !store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
      }
    }

    // Create user in auth.users (this would typically be done through Supabase Auth)
    // For now, we'll just create the user_store_map entry
    // In a real implementation, you'd create the user first, then map them

    // Create user mapping
    const { data: userMapping, error: mappingError } = await supabase
      .from('user_store_map')
      .insert([{
        user_id: validatedData.email, // Using email as user_id for now
        store_id: validatedData.store_id || null,
        role: validatedData.role,
        name: validatedData.name,
        email: validatedData.email,
      }])
      .select()
      .single();

    if (mappingError) {
      console.error('Error creating user mapping:', mappingError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ user: userMapping }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: mockCookies }
    );

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, ...updateData } = body;
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const validatedData = updateUserSchema.parse(updateData);

    // Update user mapping
    const { data: userMapping, error: updateError } = await supabase
      .from('user_store_map')
      .update(validatedData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: userMapping });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in PUT /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: mockCookies }
    );

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent deleting self
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete user mappings
    const { error: deleteError } = await supabase
      .from('user_store_map')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
