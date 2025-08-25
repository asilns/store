import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { mockCookies } from '@/lib/utils/mockCookies';

// Zod schemas for validation
const createInvoiceSchema = z.object({
  plan: z.enum(['basic', 'pro']),
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['paid', 'unpaid']).default('unpaid'),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  issue_date: z.string().optional(), // ISO date string
  due_date: z.string().optional(), // ISO date string
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit_price: z.number().positive('Unit price must be positive'),
    total: z.number().positive('Total must be positive'),
  })).min(1, 'At least one item is required'),
});

const updateInvoiceSchema = z.object({
  plan: z.enum(['basic', 'pro']).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  status: z.enum(['paid', 'unpaid']).optional(),
  customer_name: z.string().min(1, 'Customer name is required').optional(),
  customer_email: z.string().email('Valid email is required').optional(),
  customer_phone: z.string().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
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

    // Get invoices for this store
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error in GET /api/store/invoices:', error);
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
    const { storeId, ...invoiceData } = body;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const validatedData = createInvoiceSchema.parse(invoiceData);

    // Check if user has permission to create invoices in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners, admins, and managers can create invoices
    if (!['owner', 'admin', 'manager'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('number')
      .eq('store_id', storeId)
      .order('number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.number) {
      const match = lastInvoice.number.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        store_id: storeId,
        plan: validatedData.plan,
        number: invoiceNumber,
        amount: validatedData.amount,
        status: validatedData.status,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        issue_date: validatedData.issue_date || new Date().toISOString(),
        due_date: validatedData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: validatedData.notes,
        terms: validatedData.terms,
      }])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in POST /api/store/invoices:', error);
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
    const { invoice_id, ...updateData } = body;
    
    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const validatedData = updateInvoiceSchema.parse(updateData);

    // Get invoice to check store access
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('store_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has permission to update invoices in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', invoice.store_id)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners, admins, and managers can update invoices
    if (!['owner', 'admin', 'manager'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(validatedData)
      .eq('id', invoice_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error in PUT /api/store/invoices:', error);
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
    const invoiceId = searchParams.get('invoiceId');
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get invoice to check store access
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('store_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if user has permission to delete invoices in this store
    const { data: userStore, error: checkError } = await supabase
      .from('user_store_map')
      .select('role')
      .eq('user_id', user.id)
      .eq('store_id', invoice.store_id)
      .single();

    if (checkError || !userStore) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
    }

    // Only owners and admins can delete invoices
    if (!['owner', 'admin'].includes(userStore.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete invoice
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteError) {
      console.error('Error deleting invoice:', deleteError);
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/store/invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
