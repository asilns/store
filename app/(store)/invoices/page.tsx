"use client";

import { useRef, useState } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { InvoiceTemplate } from "@/components/invoices/InvoiceTemplate";
import { generateAndDownloadPDF, generatePDFBlob, downloadPDFFromBlob, downloadPDFAlternative, generateInvoiceHTML } from "@/lib/utils/pdfGenerator";
import { Download, Eye, FileText, Globe } from "lucide-react";
import { toast } from "sonner";

function InvoicesPageContent() {
  const { t } = useTranslations();
  const { locale, direction } = useLocale();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample invoice data
  const sampleInvoiceData = {
    invoice_number: "INV-2024-001",
    store_name: "Tech Gadgets Store",
    store_logo: "https://via.placeholder.com/150x50/3B82F6/FFFFFF?text=Tech+Store",
    customer_name: "John Doe",
    customer_email: "john.doe@example.com",
    customer_phone: "+1 (555) 123-4567",
    issue_date: new Date("2024-01-15"),
    due_date: new Date("2024-02-15"),
    subtotal_cents: 29997, // $299.97
    tax_cents: 2999, // $29.99
    shipping_cents: 1500, // $15.00
    total_cents: 34496, // $344.96
    currency: "USD",
    items: [
      {
        description: "Wireless Bluetooth Headphones",
        quantity: 2,
        unit_price_cents: 9999, // $99.99
        total_cents: 19998, // $199.98
      },
      {
        description: "Smartphone Case",
        quantity: 1,
        unit_price_cents: 1999, // $19.99
        total_cents: 1999, // $19.99
      },
      {
        description: "USB-C Cable",
        quantity: 3,
        unit_price_cents: 1499, // $14.99
        total_cents: 4497, // $44.97
      },
      {
        description: "Screen Protector",
        quantity: 2,
        unit_price_cents: 1499, // $14.99
        total_cents: 2998, // $29.98
      },
    ],
    notes: "Thank you for your order! Please note that all sales are final.",
    terms: "Payment is due within 30 days. Late payments may incur additional fees.",
  };

  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Invoice element not found");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Starting PDF generation...");
      // Convert sample data to InvoiceData format
      const invoiceData = {
        invoiceNumber: sampleInvoiceData.invoice_number,
        date: sampleInvoiceData.issue_date,
        dueDate: sampleInvoiceData.due_date,
        billTo: {
          name: sampleInvoiceData.customer_name,
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA"
        },
        shipTo: {
          name: sampleInvoiceData.customer_name,
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA"
        },
        items: sampleInvoiceData.items.map(item => ({
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price_cents / 100
        })),
        subtotal: sampleInvoiceData.subtotal_cents / 100,
        tax: sampleInvoiceData.tax_cents / 100,
        total: sampleInvoiceData.total_cents / 100,
        notes: sampleInvoiceData.notes
      };
      
      await generateAndDownloadPDF(invoiceData, locale as 'en' | 'ar');
      console.log("PDF generated successfully");
      toast.success(t("pdfGeneratedSuccessfully"));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t("pdfGenerationFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error("Invoice element not found");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Starting PDF blob generation...");
      // Convert sample data to InvoiceData format
      const invoiceData = {
        invoiceNumber: sampleInvoiceData.invoice_number,
        date: sampleInvoiceData.issue_date,
        dueDate: sampleInvoiceData.due_date,
        billTo: {
          name: sampleInvoiceData.customer_name,
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA"
        },
        shipTo: {
          name: sampleInvoiceData.customer_name,
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "USA"
        },
        items: sampleInvoiceData.items.map(item => ({
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price_cents / 100
        })),
        subtotal: sampleInvoiceData.subtotal_cents / 100,
        tax: sampleInvoiceData.tax_cents / 100,
        total: sampleInvoiceData.total_cents / 100,
        notes: sampleInvoiceData.notes
      };
      
      const blob = await generatePDFBlob(invoiceData, locale as 'en' | 'ar');
      
      console.log("PDF blob generated, size:", blob.size);
      
      if (blob.size === 0) {
        throw new Error("Generated PDF blob is empty");
      }
      
      // Try the main download method first
      try {
        downloadPDFFromBlob(blob, `invoice-${sampleInvoiceData.invoice_number}-${locale}.pdf`);
        console.log("PDF downloaded using main method");
      } catch (downloadError) {
        console.log("Main download method failed, trying alternative:", downloadError);
        // Fallback to alternative method
        downloadPDFAlternative(generateInvoiceHTML(invoiceData, locale as 'en' | 'ar'), `invoice-${sampleInvoiceData.invoice_number}-${locale}.pdf`);
        console.log("PDF downloaded using alternative method");
      }
      
      toast.success(t("pdfDownloadedSuccessfully"));
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t("pdfDownloadFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewInvoice = () => {
    if (invoiceRef.current) {
      invoiceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("invoices")}</h1>
            <p className="text-muted-foreground">
              {t("generateAndDownloadInvoices")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePreviewInvoice}>
              <Eye className="h-4 w-4 mr-2" />
              {t("preview")}
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating}>
              <Download className="h-4 w-4 mr-2" />
              {t("downloadPDF")}
            </Button>
            <Button onClick={handleGeneratePDF} disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? t("generating") : t("generatePDF")}
            </Button>
          </div>
        </div>

        {/* Language Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("currentLanguage")}
            </CardTitle>
            <CardDescription>
              {t("invoiceLanguageDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={locale === 'en' ? 'default' : 'outline'}>
                English
              </Badge>
              <Badge variant={locale === 'ar' ? 'default' : 'outline'}>
                العربية
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t("direction")}: {direction === 'rtl' ? 'RTL' : 'LTR'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{t("invoicePreview")}</CardTitle>
            <CardDescription>
              {t("invoicePreviewDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={invoiceRef}
              className="bg-white border rounded-lg overflow-hidden"
            >
              <InvoiceTemplate data={sampleInvoiceData} />
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToUse")}</CardTitle>
            <CardDescription>
              {t("invoiceUsageInstructions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">1</div>
                  <h3 className="font-semibold mb-2">{t("preview")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("previewDescription")}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">2</div>
                  <h3 className="font-semibold mb-2">{t("generate")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("generateDescription")}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">3</div>
                  <h3 className="font-semibold mb-2">{t("download")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("downloadDescription")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Current Language:</strong> {locale}</div>
              <div><strong>Direction:</strong> {direction}</div>
              <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side rendering'}</div>
              <div><strong>PDF Support:</strong> {typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function' ? 'Yes' : 'No'}</div>
              <div><strong>Blob Support:</strong> {typeof Blob !== 'undefined' ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

export default function InvoicesPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <InvoicesPageContent />
    </ProtectedRoute>
  );
}
