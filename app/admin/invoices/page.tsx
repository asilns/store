"use client";

import { useMemo, useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Edit, Trash2, Eye, Download, Calendar, AlertCircle, CheckCircle, XCircle, Clock, CreditCard, DollarSign, FileText, Send, Receipt, Store, Users, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { z } from "zod";
import { generateAndDownloadPDF } from "@/lib/utils/pdfGenerator";

// Zod schemas for validation
const invoiceSchema = z.object({
  storeId: z.string().min(1, "Store is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.enum(["USD", "QAR"]),
  description: z.string().min(1, "Description is required"),
  items: z.array(z.object({
    description: z.string().min(1, "Item description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
  })).min(1, "At least one item is required"),
});

function AdminInvoicesPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  
  // Form data
  const [invoiceFormData, setInvoiceFormData] = useState<{
    store_id: string;
    invoiceNumber: string;
    dueDate: string;
    amount: number;
    currency: "USD" | "QAR";
    description: string;
    items: { description: string; quantity: number; unitPrice: number; }[];
  }>({
    store_id: "",
    invoiceNumber: "",
    dueDate: "",
    amount: 0,
    currency: "USD",
    description: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
  });
  
  const [formErrors, setFormErrors] = useState<any>({});

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockStores = [
      { id: "1", name: "Tech Store" },
      { id: "2", name: "Fashion Boutique" },
      { id: "3", name: "Home Decor" },
    ];
    
    const mockInvoices = [
      {
        id: "inv_1",
        storeId: "1",
        storeName: "Tech Store",
        invoiceNumber: "INV-2024-001",
        status: "paid",
        amount: 9999, // $99.99
        currency: "USD",
        description: "Pro Plan Subscription - January 2024",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-01-31"),
        paidDate: new Date("2024-01-15"),
        paymentMethod: "card_visa",
        items: [
          { description: "Pro Plan Subscription", quantity: 1, unitPrice: 9999 },
        ],
        notes: "Thank you for your business!",
        customer: {
          name: "John Doe",
          email: "john@techstore.com",
          address: "123 Tech St, Silicon Valley, CA 94025"
        }
      },
      {
        id: "inv_2",
        storeId: "2",
        storeName: "Fashion Boutique",
        invoiceNumber: "INV-2024-002",
        status: "pending",
        amount: 4999, // $49.99
        currency: "USD",
        description: "Basic Plan Subscription - January 2024",
        issueDate: new Date("2024-01-05"),
        dueDate: new Date("2024-02-05"),
        paidDate: null,
        paymentMethod: null,
        items: [
          { description: "Basic Plan Subscription", quantity: 1, unitPrice: 4999 },
        ],
        notes: "Payment due within 30 days",
        customer: {
          name: "Jane Smith",
          email: "jane@fashionboutique.com",
          address: "456 Fashion Ave, New York, NY 10001"
        }
      },
      {
        id: "inv_3",
        storeId: "3",
        storeName: "Home Decor",
        invoiceNumber: "INV-2024-003",
        status: "overdue",
        amount: 9999, // $99.99
        currency: "USD",
        description: "Pro Plan Subscription - January 2024",
        issueDate: new Date("2024-01-10"),
        dueDate: new Date("2024-01-10"),
        paidDate: null,
        paymentMethod: null,
        items: [
          { description: "Pro Plan Subscription", quantity: 1, unitPrice: 9999 },
        ],
        notes: "Payment overdue. Please contact us immediately.",
        customer: {
          name: "Mike Johnson",
          email: "mike@homedecor.com",
          address: "789 Home St, Los Angeles, CA 90210"
        }
      }
    ];
    
    setStores(mockStores);
    setInvoices(mockInvoices);
    setLoading(false);
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
              const store = stores.find(s => s.id === invoice.store_id);
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
              const matchesStore = storeFilter === "all" || invoice.store_id === storeFilter;
      
      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [invoices, stores, searchTerm, statusFilter, storeFilter]);

  const formatCurrency = (cents: number, currency: string) => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    const currencyCode = currency === 'QAR' ? 'QAR' : 'USD';
    return new Intl.NumberFormat(config, {
      style: 'currency',
      currency: currencyCode
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-US').format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default", label: t("paid"), icon: CheckCircle },
      pending: { variant: "outline", label: t("pending"), icon: Clock },
      overdue: { variant: "destructive", label: t("overdue"), icon: AlertCircle },
      draft: { variant: "secondary", label: t("draft"), icon: FileText },
      canceled: { variant: "secondary", label: t("cancelled"), icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodConfig = {
      card_visa: "💳 Visa",
      card_mastercard: "💳 Mastercard",
      card_amex: "💳 Amex",
      bank_transfer: "🏦 Bank Transfer",
      paypal: "PayPal",
    };
    
    return methodConfig[method as keyof typeof methodConfig] || "💳 Card";
  };

  const handleCreateInvoice = () => {
    setInvoiceFormData({
      store_id: "",
      invoiceNumber: "",
      dueDate: "",
      amount: 0,
      currency: "USD",
      description: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    });
    setFormErrors({});
    setIsCreateInvoiceOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setInvoiceFormData({
              store_id: invoice.store_id,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      items: invoice.items,
    });
    setFormErrors({});
    setIsEditInvoiceOpen(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setViewingInvoice(invoice);
    setIsViewInvoiceOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice?.status === 'paid') {
      toast.error("Cannot delete paid invoices.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      toast.success("Invoice deleted successfully");
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    // In real app, this would send the invoice via email
    toast.info("Sending invoice...");
    setTimeout(() => {
      toast.success("Invoice sent successfully");
    }, 2000);
  };

  const handleGeneratePDF = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        toast.error("Invoice not found");
        return;
      }

      toast.info("Generating PDF...");
      
      // Convert invoice data to InvoiceData format
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.issueDate,
        dueDate: invoice.dueDate,
        billTo: {
          name: invoice.storeName,
          address: "Store Address",
          city: "Store City",
          state: "Store State",
          zip: "12345",
          country: "Store Country"
        },
        shipTo: {
          name: invoice.storeName,
          address: "Store Address",
          city: "Store City",
          state: "Store State",
          zip: "12345",
          country: "Store Country"
        },
        items: invoice.items.map((item: any) => ({
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice / 100 // Convert from cents
        })),
        subtotal: invoice.amount / 100,
        tax: 0,
        total: invoice.amount / 100,
        notes: invoice.description
      };
      
      await generateAndDownloadPDF(invoiceData, locale as 'en' | 'ar');
      toast.success("PDF generated and downloaded successfully");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    setInvoices(invoices.map(i => 
      i.id === invoiceId 
        ? { ...i, status: 'paid', paidDate: new Date() }
        : i
    ));
    toast.success("Invoice marked as paid");
  };

  const addInvoiceItem = () => {
    setInvoiceFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceFormData.items.length > 1) {
      setInvoiceFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setInvoiceFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return invoiceFormData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
  };

  const validateInvoiceForm = () => {
    try {
      invoiceSchema.parse(invoiceFormData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleInvoiceSubmit = async () => {
    if (!validateInvoiceForm()) return;

    if (editingInvoice) {
      // Update existing invoice
      setInvoices(invoices.map(i => 
        i.id === editingInvoice.id 
          ? { 
              ...i, 
              ...invoiceFormData,
              dueDate: new Date(invoiceFormData.dueDate),
              amount: calculateTotal(),
            }
          : i
      ));
      toast.success("Invoice updated successfully");
      setIsEditInvoiceOpen(false);
    } else {
      // Create new invoice
              const store = stores.find(s => s.id === invoiceFormData.store_id);
      const newInvoice = {
        id: `inv_${Date.now()}`,
        ...invoiceFormData,
        storeName: store?.name || "Unknown Store",
        status: "pending",
        issueDate: new Date(),
        dueDate: new Date(invoiceFormData.dueDate),
        paidDate: null,
        paymentMethod: null,
        amount: calculateTotal(),
        notes: "",
        customer: {
          name: "Customer Name",
          email: "customer@example.com",
          address: "Customer Address"
        }
      };
      setInvoices([newInvoice, ...invoices]);
      toast.success("Invoice created successfully");
      setIsCreateInvoiceOpen(false);
    }
  };

  const handleExportInvoices = () => {
    // In real app, implement CSV export
    toast.info("Export functionality coming soon");
  };

  if (loading) {
    return (
      <AppShell sidebar={<AdminSidebar />} title={t("admin.invoices.title")}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell sidebar={<AdminSidebar />} title={t("admin.invoices.title")}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.invoices.title")}</h1>
            <p className="text-muted-foreground">{t("admin.invoices.description")}</p>
          </div>
          <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={handleExportInvoices}>
              <Download className="h-4 w-4 mr-2" />
              {t("export")}
            </Button>
            <Button onClick={handleCreateInvoice}>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.invoices.newInvoice")}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalInvoices")}</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
              <p className="text-xs text-muted-foreground">
                {invoices.filter(i => i.status === 'paid').length} {t("paid")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalAmount")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  invoices.reduce((sum, i) => sum + i.amount, 0),
                  "USD"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("allInvoices")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingAmount")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  invoices
                    .filter(i => i.status === 'pending' || i.status === 'overdue')
                    .reduce((sum, i) => sum + i.amount, 0),
                  "USD"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("awaitingPayment")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("overdueInvoices")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(i => i.status === 'overdue').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("requiresAttention")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className={`grid gap-4 md:grid-cols-3 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="space-y-2">
                <Label htmlFor="search">{t("search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t("searchInvoices")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">{t("filterByStatus")}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="paid">{t("paid")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="overdue">{t("overdue")}</SelectItem>
                    <SelectItem value="draft">{t("draft")}</SelectItem>
                    <SelectItem value="canceled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="store-filter">{t("filterByStore")}</Label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filterByStore")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.invoices.allInvoices")}</CardTitle>
            <CardDescription>
              {filteredInvoices.length} {t("invoices")} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("noInvoicesFound")}</p>
                <p className="text-sm">{t("createFirstInvoice")}</p>
                <Button className="mt-4" onClick={handleCreateInvoice}>
                  {t("admin.invoices.newInvoice")}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoice")}</TableHead>
                    <TableHead>{t("store")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("dates")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.storeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customer.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invoice.status)}
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              {t("markAsPaid")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </div>
                        {invoice.paymentMethod && (
                          <div className="text-sm text-muted-foreground">
                            {getPaymentMethodIcon(invoice.paymentMethod)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t("issued")}: </span>
                            {formatDate(invoice.issueDate)}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t("due")}: </span>
                            {formatDate(invoice.dueDate)}
                          </div>
                          {invoice.paidDate && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">{t("paid")}: </span>
                              {formatDate(invoice.paidDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGeneratePDF(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice.id)}
                            disabled={invoice.status === 'paid'}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                            disabled={invoice.status === 'paid'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            disabled={invoice.status === 'paid'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Invoice Dialog */}
        <Dialog open={isCreateInvoiceOpen || isEditInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? t("editInvoice") : t("admin.invoices.newInvoice")}
              </DialogTitle>
              <DialogDescription>
                {editingInvoice ? t("updateInvoiceInformation") : t("createNewInvoice")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeSelect">{t("store")}</Label>
                  <Select value={invoiceFormData.storeId} onValueChange={(value) => setInvoiceFormData(prev => ({ ...prev, storeId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectStore")} />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.storeId && (
                    <p className="text-sm text-red-500">{formErrors.storeId}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">{t("invoiceNumber")}</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className={formErrors.invoiceNumber ? "border-red-500" : ""}
                  />
                  {formErrors.invoiceNumber && (
                    <p className="text-sm text-red-500">{formErrors.invoiceNumber}</p>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t("dueDate")}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={formErrors.dueDate ? "border-red-500" : ""}
                  />
                  {formErrors.dueDate && (
                    <p className="text-sm text-red-500">{formErrors.dueDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("currency")}</Label>
                  <Select value={invoiceFormData.currency} onValueChange={(value: "USD" | "QAR") => setInvoiceFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="QAR">QAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  value={invoiceFormData.description}
                  onChange={(e) => setInvoiceFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t("invoiceItems")}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addItem")}
                  </Button>
                </div>
                
                {invoiceFormData.items.map((item, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="md:col-span-2">
                      <Label>{t("description")}</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        placeholder={t("itemDescription")}
                      />
                    </div>
                    <div>
                      <Label>{t("quantity")}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>{t("unitPrice")}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice / 100}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', Math.round(parseFloat(e.target.value) * 100) || 0)}
                        />
                      </div>
                      {invoiceFormData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {formErrors.items && (
                  <p className="text-sm text-red-500">{formErrors.items}</p>
                )}
                
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {t("total")}: {formatCurrency(calculateTotal(), invoiceFormData.currency)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleInvoiceSubmit}>
                {editingInvoice ? t("update") : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("viewInvoice")} - {viewingInvoice?.invoiceNumber}</DialogTitle>
              <DialogDescription>
                {viewingInvoice?.storeName} - {viewingInvoice?.description}
              </DialogDescription>
            </DialogHeader>
            
            {viewingInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">{t("invoiceDetails")}</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">{t("invoiceNumber")}:</span> {viewingInvoice.invoiceNumber}</div>
                      <div><span className="font-medium">{t("status")}:</span> {getStatusBadge(viewingInvoice.status)}</div>
                      <div><span className="font-medium">{t("issueDate")}:</span> {formatDate(viewingInvoice.issueDate)}</div>
                      <div><span className="font-medium">{t("dueDate")}:</span> {formatDate(viewingInvoice.dueDate)}</div>
                      {viewingInvoice.paidDate && (
                        <div><span className="font-medium">{t("paidDate")}:</span> {formatDate(viewingInvoice.paidDate)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">{t("customerInformation")}</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">{t("name")}:</span> {viewingInvoice.customer.name}</div>
                      <div><span className="font-medium">{t("email")}:</span> {viewingInvoice.customer.email}</div>
                      <div><span className="font-medium">{t("address")}:</span> {viewingInvoice.customer.address}</div>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Items */}
                <div>
                  <h3 className="font-semibold mb-2">{t("invoiceItems")}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead className="text-right">{t("quantity")}</TableHead>
                        <TableHead className="text-right">{t("unitPrice")}</TableHead>
                        <TableHead className="text-right">{t("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice, viewingInvoice.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.quantity * item.unitPrice, viewingInvoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="text-right mt-4">
                    <div className="text-lg font-semibold">
                      {t("total")}: {formatCurrency(viewingInvoice.amount, viewingInvoice.currency)}
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {viewingInvoice.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">{t("notes")}</h3>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewInvoiceOpen(false)}>
                {t("close")}
              </Button>
              <Button onClick={() => viewingInvoice && handleGeneratePDF(viewingInvoice.id)}>
                <Download className="h-4 w-4 mr-2" />
                {t("downloadPDF")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

export default function AdminInvoicesPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminInvoicesPageContent />
    </ProtectedRoute>
  );
}
