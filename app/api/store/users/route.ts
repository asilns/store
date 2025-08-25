import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient } from '@/lib/supabase/server';

// GET - Get store users
export async function GET(request: NextRequest) {
  try {
    const { client: supabaseClient, userId, error: authError } = await createAuthenticatedApiClient(request);
    if (authError || !userId) return NextResponse.json({ error: authError || 'User not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });

    // Check if user has access to this store users - admin, owner
    const { data: userStoreAccess, error: accessError } = await supabaseClient
      .from('user_store_map')
      .select('role')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();
    
    // Access error - admin, owner only
    if (accessError || !userStoreAccess) return NextResponse.json({ error: 'Access denied to this store' }, { status: 403 });
    if (!['owner', 'admin'].includes(userStoreAccess.role)) return NextResponse.json({ error: 'Insufficient permissions to view users' }, { status: 403 });

    // Get all users for this store with their user details
    const { data: users, error } = await supabaseClient
      .from('user_store_map')
      .select(`
        user_id,
        name,
        role,
        created_at,
        updated_at
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    
    console.log('users', users);
    
    // Error getting users
    if (error) {
      console.error('Error fetching store users:', error);
      return NextResponse.json({ error: 'Failed to fetch store users' }, { status: 500 });
    }

    console.log('Fetched store users:', users?.length || 0);

    // Return users to frontend
    return NextResponse.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Store users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}









// POST - Invite new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role } = body;

    console.log('=== STARTING USER INVITATION ===');
    console.log('Request data:', { email, name, role });

    // Basic validation
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    const validRoles = new Set(['admin', 'manager', 'staff', 'viewer']);
    if (!validRoles.has(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Auth
    const { client: supabaseClient, userId, error: authError } =
      await createAuthenticatedApiClient(request);
    if (authError || !userId) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError || 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('Authenticated user ID:', userId);

    // Store ID
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    console.log('Store ID:', storeId);

    // Access check
    const { data: userStoreAccess, error: accessError } = await supabaseClient
      .from('user_store_map')
      .select('role')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();

    if (accessError || !userStoreAccess) {
      console.error('Access check error:', accessError);
      return NextResponse.json(
        { error: 'Access denied to this store' },
        { status: 403 }
      );
    }
    if (!['owner', 'admin'].includes(userStoreAccess.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite users' },
        { status: 400 }
      );
    }

    console.log('User has access, role:', userStoreAccess.role);

    // 🔑 Use RPC transaction for atomic insert
    const { data, error } = await supabaseClient.rpc('invite_user_tx', {
      p_email: email,
      p_name: name,
      p_store_id: storeId,
      p_role: role,
    });

    if (error) {
      console.error('RPC error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to invite user' },
        { status: 500 }
      );
    }

    console.log('=== USER INVITATION SUCCESSFUL ===');
    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      user: data?.[0] || null,
    });
  } catch (error) {
    console.error('=== USER INVITATION FAILED ===');
    console.error('Invite user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}























// PUT - Update user role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id: targetUserId, role } = body;

    // Basic validation
    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    if (!['owner', 'admin', 'manager', 'staff', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    const { client: supabaseClient, userId, error: authError } = await createAuthenticatedApiClient(request);
    if (authError || !userId) return NextResponse.json({ error: authError || 'User not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });

    const { data: userStoreAccess, error: accessError } = await supabaseClient
      .from('user_store_map')
      .select('role')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();
    if (accessError || !userStoreAccess) return NextResponse.json({ error: 'Access denied to this store' }, { status: 403 });
    if (!['owner', 'admin'].includes(userStoreAccess.role)) return NextResponse.json({ error: 'Insufficient permissions to update user roles' }, { status: 403 });
    if (role === 'owner' && userStoreAccess.role !== 'owner') return NextResponse.json({ error: 'Only store owners can assign owner role' }, { status: 403 });

    const { error: updateError } = await supabaseClient
      .from('user_store_map')
      .update({ role })
      .eq('user_id', targetUserId)
      .eq('store_id', storeId);
    if (updateError) return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove user from store
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id: targetUserId } = body;

    // Basic validation
    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { client: supabaseClient, userId, error: authError } = await createAuthenticatedApiClient(request);
    if (authError || !userId) return NextResponse.json({ error: authError || 'User not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    if (!storeId) return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });

    const { data: userStoreAccess, error: accessError } = await supabaseClient
      .from('user_store_map')
      .select('role')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();
    if (accessError || !userStoreAccess) return NextResponse.json({ error: 'Access denied to this store' }, { status: 403 });
    if (!['owner', 'admin'].includes(userStoreAccess.role)) return NextResponse.json({ error: 'Insufficient permissions to remove users' }, { status: 403 });
    if (targetUserId === userId) return NextResponse.json({ error: 'Cannot remove yourself from the store' }, { status: 400 });

    const { data: targetUserRole, error: targetRoleError } = await supabaseClient
      .from('user_store_map')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('store_id', storeId)
      .single();
    if (targetRoleError || !targetUserRole) return NextResponse.json({ error: 'User not found in store' }, { status: 404 });
    if (targetUserRole.role === 'owner' && userStoreAccess.role !== 'owner') return NextResponse.json({ error: 'Only store owners can remove other owners' }, { status: 403 });

    const { error: removeError } = await supabaseClient.from('user_store_map').delete().eq('user_id', targetUserId).eq('store_id', storeId);
    if (removeError) return NextResponse.json({ error: 'Failed to remove user from store' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'User removed from store successfully' });
  } catch (error) {
    console.error('Remove user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
