import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { client, userId, error } = await createAuthenticatedApiClient(request);
    
    if (error || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's stores
    const { data: userStores, error: storesError } = await client
      .from('user_store_map')
      .select('store_id, role')
      .eq('user_id', userId);

    if (storesError || !userStores?.length) {
      return NextResponse.json(
        { error: 'No stores found for user' },
        { status: 404 }
      );
    }

    // Get store ID from query params or use first store
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id') || userStores[0].store_id;

    // Verify user has access to this store
    const hasAccess = userStores.some((us: { store_id: string }) => us.store_id === storeId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this store' },
        { status: 403 }
      );
    }

    // Get orders for the store
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          product_name,
          product_sku,
          quantity,
          unit_price_cents,
          total_cents
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Status',
      'Subtotal',
      'Tax',
      'Shipping',
      'Total',
      'Commission',
      'Profit',
      'Created Date',
      'Items'
    ];

    const csvRows = orders?.map((order: any) => [
      order.order_number,
      order.customer_name || '',
      order.customer_email || '',
      order.status,
      (order.subtotal_cents / 100).toFixed(2),
      (order.tax_cents / 100).toFixed(2),
      (order.shipping_cents / 100).toFixed(2),
      (order.total_cents / 100).toFixed(2),
      (order.commission_cents / 100).toFixed(2),
      (order.profit_cents / 100).toFixed(2),
      new Date(order.created_at).toLocaleDateString(),
      order.order_items?.map((item: any) => 
        `${item.product_name} (${item.quantity}x $${(item.unit_price_cents / 100).toFixed(2)})`
      ).join('; ') || ''
    ]) || [];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-${storeId}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
