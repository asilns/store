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

    // Get products for the store
    const { data: products, error: productsError } = await client
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      'SKU',
      'Name',
      'Description',
      'Category',
      'Status',
      'Base Price',
      'Unit Cost',
      'Commission %',
      'Created Date'
    ];

    const csvRows = products?.map((product: any) => [
      product.sku || '',
      product.name,
      product.description || '',
      product.category || '',
      product.status,
      (product.base_price_cents / 100).toFixed(2),
      (product.unit_cost_cents / 100).toFixed(2),
      ((product.commission_bps || 0) / 100).toFixed(2),
      new Date(product.created_at).toLocaleDateString()
    ]) || [];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-${storeId}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
