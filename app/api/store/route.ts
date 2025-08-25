import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient, createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Get user's stores
export async function GET(request: NextRequest) {
  try {
    const { client: supabaseClient, userId, error: authError } = await createAuthenticatedApiClient(request);

    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'User not authenticated' }, { status: 401 });
    }

    // First, get the user's store mappings
    const { data: userStoreMappings, error: mappingsError } = await supabaseClient
      .from('user_store_map')
      .select('store_id, role')
      .eq('user_id', userId);

    console.log('User ID:', userId); // Debug log
    console.log('User store mappings:', userStoreMappings); // Debug log
    console.log('Mappings error:', mappingsError); // Debug log

    if (mappingsError) {
      console.error('Error fetching user store mappings:', mappingsError);
      return NextResponse.json({ error: 'Failed to fetch user store mappings' }, { status: 500 });
    }

    if (!userStoreMappings || userStoreMappings.length === 0) {
      console.log('No user store mappings found'); // Debug log
      return NextResponse.json({ success: true, stores: [], hasStore: false });
    }

    // Get the store IDs from the mappings
    const storeIds = userStoreMappings.map((mapping: any) => mapping.store_id);
    console.log('Store IDs to fetch:', storeIds); // Debug log

    // Fetch the stores data
    const { data: stores, error: storesError } = await supabaseClient
      .from('stores')
      .select('id, name, plan, status, created_at, updated_at')
      .in('id', storeIds);

    console.log('Stores data:', stores); // Debug log
    console.log('Stores error:', storesError); // Debug log

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    // Combine the data
    const combinedStores = userStoreMappings.map((mapping: any) => {
      const store = stores?.find((s: any) => s.id === mapping.store_id);
      return {
        store_id: mapping.store_id,
        role: mapping.role,
        stores: store
      };
    }).filter((item: any) => item.stores); // Only include items where store data was found

    return NextResponse.json({ 
      success: true, 
      stores: combinedStores, 
      hasStore: combinedStores.length > 0 
    });

  } catch (error) {
    console.error('Store API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new store
export async function POST(request: NextRequest) {
  try {
    const { name, plan = 'basic' } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const { client: supabaseClient, userId, error: authError, isSuperAdmin } = await createAuthenticatedApiClient(request);

    if (authError || !userId) {
      return NextResponse.json({ error: authError || 'User not authenticated' }, { status: 401 });
    }

    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Super admins cannot create stores. Use the admin interface instead.' }, { status: 403 });
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Insert store (no .select to avoid RLS issues)
    const { error: storeError } = await supabaseClient
      .from('stores')
      .insert({ name, plan, status: 'active', owner_id: userId });

    if (storeError) {
      return NextResponse.json({ error: `Failed to create store: ${storeError.message}` }, { status: 500 });
    }

    // Create user-store mapping
    const { data: storeList, error: mappingError } = await supabaseClient
      .from('stores')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!storeList || storeList.length === 0) {
      return NextResponse.json({ error: 'Store created but could not find store ID' }, { status: 500 });
    }

    const storeId = storeList[0].id;

    const { error: userStoreMappingError } = await supabaseClient
      .from('user_store_map')
      .insert({ user_id: userId, store_id: storeId, role: 'owner' });

    if (userStoreMappingError) {
      await supabaseClient.from('stores').delete().eq('id', storeId);
      return NextResponse.json({ error: `Failed to create store mapping: ${userStoreMappingError.message}` }, { status: 500 });
    }

    // Fetch full store data (RLS-safe)
    const { data: store, error: fetchError } = await supabaseClient
      .from('stores')
      .select('id, name, plan, status, created_at, updated_at, owner_id')
      .eq('id', storeId)
      .single();

    if (fetchError || !store) {
      return NextResponse.json({ error: 'Store created but failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, store, message: 'Store created successfully' });

  } catch (error) {
    console.error('Store creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - User signup
export async function PUT(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const supabaseClient = createServerSupabaseClient();

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    if (!authData.user) return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });

    const { error: insertError } = await supabaseClient
      .from('users')
      .insert({ id: authData.user.id, email, name, role: null });

    if (insertError) {
      console.error('Failed to insert user into users table:', insertError);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: authData.user.id, email, name, role: null, isSuperAdmin: false }, 
      message: 'Account created successfully' 
    });

  } catch (error) {
    console.error('Store signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - User login
export async function PATCH(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Server-side login is not supported; guide users to frontend login
    return NextResponse.json({ 
      error: 'Please use the login form on the frontend. Server-side login is not supported.',
      code: 'USE_CLIENT_LOGIN'
    }, { status: 400 });

  } catch (error) {
    console.error('Store login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
