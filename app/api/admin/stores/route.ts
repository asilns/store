import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { mockCookies } from '@/lib/utils/mockCookies';

// Zod schemas for validation
const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  plan: z.enum(['basic', 'pro']).default('basic'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
});

const updateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').optional(),
  plan: z.enum(['basic', 'pro']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
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

    // Get all stores with user counts and subscription info
    const { data: stores, error } = await supabase
      .from('stores')
      .select(`
        *,
        user_store_map (
          user_id,
          role,
          name,
          email
        ),
        subscriptions (
          id,
          plan,
          status,
          start_date,
          end_date,
          grace_period_end
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    // Process the data to get user counts and active subscriptions
    const processedStores = stores?.map((store: any) => {
      const userCount = store.user_store_map?.length || 0;
      const activeSubscription = store.subscriptions?.find((sub: any) => 
        ['active', 'trial', 'grace_period'].includes(sub.status)
      );
      
      return {
        ...store,
        user_count: userCount,
        active_subscription: activeSubscription,
        subscription_count: store.subscriptions?.length || 0,
      };
    }) || [];

    return NextResponse.json({ stores: processedStores });
  } catch (error) {
    console.error('Error in GET /api/admin/stores:', error);
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
    const validatedData = createStoreSchema.parse(body);

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

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in POST /api/admin/stores:', error);
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
    const { store_id, ...updateData } = body;
    
    if (!store_id) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const validatedData = updateStoreSchema.parse(updateData);

    // Update store
    const { data: store, error: updateError } = await supabase
      .from('stores')
      .update(validatedData)
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating store:', updateError);
      return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in PUT /api/admin/stores:', error);
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
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
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
    console.error('Error in DELETE /api/admin/stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
