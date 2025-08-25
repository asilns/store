import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { mockCookies } from '@/lib/utils/mockCookies';

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

    // Get stores for this user
    const { data: stores, error } = await supabase
      .from('user_store_map')
      .select(`
        store_id,
        stores (
          id,
          name,
          plan,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    // Extract store data from the join
    const userStores = stores?.map((item: any) => item.stores).filter(Boolean) || [];

    return NextResponse.json({ stores: userStores });
  } catch (error) {
    console.error('Error in GET /api/store/stores:', error);
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

    const body = await request.json();
    const validatedData = body;

    // Create store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert([validatedData])
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }

    // Add user as owner of the store
    const { error: mapError } = await supabase
      .from('user_store_map')
      .insert([{
        user_id: user.id,
        store_id: store.id,
        role: 'owner',
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
      }]);

    if (mapError) {
      console.error('Error mapping user to store:', mapError);
      // Clean up the store if mapping fails
      await supabase.from('stores').delete().eq('id', store.id);
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/store/stores:', error);
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

    const body = await request.json();
    const { store_id, ...updateData } = body;
    
    if (!store_id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const validatedData = updateData;

    // Check if user has permission to update this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners and admins can update store
    if (!['owner', 'admin'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update store
    const { data: store, error: updateError } = await supabase
      .from('stores')
      .update(validatedData)
      .eq('id', store_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating store:', updateError);
      return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error('Error in PUT /api/store/stores:', error);
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

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Check if user has permission to delete this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners can delete store
    if (userStore.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete store (this will cascade to related records due to RLS)
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (deleteError) {
      console.error('Error deleting store:', deleteError);
      return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/store/stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
