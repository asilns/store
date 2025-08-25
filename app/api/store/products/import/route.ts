import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient } from '@/lib/supabase/server';
import { z } from 'zod';

// CSV row validation schema
const productImportSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  base_price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Base price must be a valid positive number'),
  unit_cost: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Unit cost must be a valid positive number'),
  commission_percent: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, 'Commission must be between 0 and 100')
});

type ProductImportRow = z.infer<typeof productImportSchema>;

export async function POST(request: NextRequest) {
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

    // Check if user has write permissions (not viewer)
    const userRole = userStores.find((us: { store_id: string; role: string }) => us.store_id === storeId)?.role;
    if (userRole === 'viewer') {
      return NextResponse.json(
        { error: 'Viewer role cannot import products' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    // Validate headers
    const requiredHeaders = ['sku', 'name', 'base_price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    const results = {
      total: dataRows.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; errors: string[] }>
    };

    const productsToInsert: Array<{
      store_id: string;
      sku: string;
      name: string;
      description?: string;
      category?: string;
      status: string;
      base_price_cents: number;
      unit_cost_cents: number;
      commission_bps?: number;
    }> = [];

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        results.errors.push({
          row: i + 2, // +2 because we start from row 2 (after header)
          errors: [`Row has ${values.length} columns but header has ${headers.length} columns`]
        });
        results.failed++;
        continue;
      }

      // Create row object
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header.toLowerCase()] = values[index];
      });

      // Validate row
      const validation = productImportSchema.safeParse(rowData);
      
      if (!validation.success) {
        const errors = validation.error.errors.map(e => e.message);
        results.errors.push({
          row: i + 2,
          errors
        });
        results.failed++;
        continue;
      }

      const validatedData = validation.data;

      // Check for duplicate SKU
      const { data: existingProduct } = await client
        .from('products')
        .select('id')
        .eq('store_id', storeId)
        .eq('sku', validatedData.sku)
        .single();

      if (existingProduct) {
        results.errors.push({
          row: i + 2,
          errors: [`SKU '${validatedData.sku}' already exists in this store`]
        });
        results.failed++;
        continue;
      }

      // Prepare product for insertion
      productsToInsert.push({
        store_id: storeId,
        sku: validatedData.sku,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        status: validatedData.status,
        base_price_cents: Math.round(parseFloat(validatedData.base_price) * 100),
        unit_cost_cents: Math.round(parseFloat(validatedData.unit_cost) * 100),
        commission_bps: validatedData.commission_percent ? Math.round(parseFloat(validatedData.commission_percent) * 100) : undefined
      });

      results.successful++;
    }

    // Insert products if any are valid
    if (productsToInsert.length > 0) {
      const { error: insertError } = await client
        .from('products')
        .insert(productsToInsert);

      if (insertError) {
        console.error('Error inserting products:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert products', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
