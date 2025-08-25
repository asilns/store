import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { mockCookies } from '@/lib/utils/mockCookies';

// Zod schemas for validation
const createOrderSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  status: z.enum(['draft', 'pending', 'shipping', 'completed', 'canceled']).default('draft'),
  total_amount: z.number().min(0, 'Total amount must be non-negative'),
  total_profit: z.number().min(0, 'Total profit must be non-negative'),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit_cost: z.number().min(0, 'Unit cost must be non-negative'),
    commission: z.number().min(0, 'Commission must be non-negative'),
    profit: z.number().min(0, 'Profit must be non-negative'),
  })).min(1, 'At least one item is required'),
});

const updateOrderSchema = z.object({
  status: z.enum(['draft', 'pending', 'shipping', 'completed', 'canceled']).optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative').optional(),
  total_profit: z.number().min(0, 'Total profit must be non-negative').optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
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

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Check if user has access to this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Get orders for this store with items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_cost,
          commission,
          profit,
          products (
            name,
            sku
          )
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error in GET /api/store/orders:', error);
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
    const { storeId, ...orderData } = body;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const validatedData = createOrderSchema.parse(orderData);

    // Check if user has permission to create orders in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners, admins, and managers can create orders
    if (!['owner', 'admin', 'manager'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        store_id: storeId,
        customer_id: validatedData.customer_id,
        status: validatedData.status,
        total_amount: validatedData.total_amount,
        total_profit: validatedData.total_profit,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        shipping_address: validatedData.shipping_address,
        notes: validatedData.notes,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = validatedData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      commission: item.commission,
      profit: item.profit,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Clean up the order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Get the complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_cost,
          commission,
          profit,
          products (
            name,
            sku
          )
        )
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete order:', fetchError);
      return NextResponse.json({ order }, { status: 201 });
    }

    return NextResponse.json({ order: completeOrder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in POST /api/store/orders:', error);
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
    const { order_id, ...updateData } = body;
    
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const validatedData = updateOrderSchema.parse(updateData);

    // Get order to check store access
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has permission to update orders in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', order.store_id)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners, admins, and managers can update orders
    if (!['owner', 'admin', 'manager'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(validatedData)
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in PUT /api/store/orders:', error);
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
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order to check store access
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user has permission to delete orders in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', order.store_id)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners and admins can delete orders
    if (!['owner', 'admin'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete order (this will cascade to order_items due to RLS)
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Error deleting order:', deleteError);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/store/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
