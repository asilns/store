import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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

    // Check if user has write permissions (owner or admin)
    const userStore = userStores.find((us: { store_id: string; role: string }) => us.store_id === storeId);
    if (!userStore || !['owner', 'admin'].includes(userStore.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can generate invoices' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invoiceId, htmlContent, locale = 'en' } = body;

    if (!invoiceId || !htmlContent) {
      return NextResponse.json(
        { error: 'Invoice ID and HTML content are required' },
        { status: 400 }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await client
      .from('invoices')
      .select(`
        *,
        stores!inner(name, slug, logo_url, currency)
      `)
      .eq('id', invoiceId)
      .eq('store_id', storeId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(htmlContent, locale);

    // Upload to Supabase Storage
    const fileName = `invoices/${storeId}/${invoice.invoice_number}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    const { data: uploadData, error: uploadError } = await client.storage
      .from('private')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get signed URL
    const { data: signedUrl } = await client.storage
      .from('private')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Update invoice with PDF URL
    const { error: updateError } = await client
      .from('invoices')
      .update({ pdf_url: fileName })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      // Don't fail the request if this update fails
    }

    return NextResponse.json({
      success: true,
      pdf_url: signedUrl?.signedUrl,
      file_path: fileName,
      message: 'PDF generated and uploaded successfully'
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generatePDF(htmlContent: string, locale: string): Promise<Buffer> {
  // Launch browser
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    
    // Set content with proper language and direction
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    const lang = locale === 'ar' ? 'ar' : 'en';
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Set language and direction
    await page.evaluateOnNewDocument((lang, direction) => {
      document.documentElement.lang = lang;
      document.documentElement.dir = direction;
    }, lang, direction);

    // Generate PDF with Arabic font support
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      preferCSSPageSize: true
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
