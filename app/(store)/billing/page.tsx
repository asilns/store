"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Download, Plus, Trash2, Edit, Eye, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

function BillingPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    price: number;
    currency: string;
    interval: string;
    nextBilling: Date;
  } | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Dialog states
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [isUpdateBillingOpen, setIsUpdateBillingOpen] = useState(false);
  const [isCancelSubscriptionOpen, setIsCancelSubscriptionOpen] = useState(false);

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockSubscription = {
      id: "sub_123",
      plan: "pro",
      status: "active",
      currentPeriodStart: new Date("2024-01-01"),
      currentPeriodEnd: new Date("2024-02-01"),
      cancelAtPeriodEnd: false,
      price: 9900, // $99.00
      currency: "USD",
      interval: "month",
      nextBilling: new Date("2024-02-01"),
    };

    const mockInvoices = [
      {
        id: "inv_001",
        number: "INV-2024-001",
        amount: 9900,
        currency: "USD",
        status: "paid",
        created_at: new Date("2024-01-01"),
        dueDate: new Date("2024-01-01"),
        pdfUrl: "https://example.com/invoice1.pdf",
        items: [
          { description: "Pro Plan - Monthly", amount: 9900, quantity: 1 }
        ]
      },
      {
        id: "inv_002",
        number: "INV-2023-012",
        amount: 9900,
        currency: "USD",
        status: "paid",
        created_at: new Date("2023-12-01"),
        dueDate: new Date("2023-12-01"),
        pdfUrl: "https://example.com/invoice2.pdf",
        items: [
          { description: "Pro Plan - Monthly", amount: 9900, quantity: 1 }
        ]
      }
    ];

    const mockPaymentMethods = [
      {
        id: "pm_001",
        type: "card",
        last4: "4242",
        brand: "visa",
        expMonth: 12,
        expYear: 2025,
        isDefault: true,
      }
    ];

    setSubscription(mockSubscription);
    setInvoices(mockInvoices);
    setPaymentMethods(mockPaymentMethods);
    setLoading(false);
  }, []);

  const formatCurrency = (cents: number, currency: string = "USD") => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    const currencyCode = locale === 'ar' ? 'QAR' : currency;
    return new Intl.NumberFormat(config, {
      style: 'currency',
      currency: currencyCode
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-US').format(date);
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default", label: t("active"), icon: CheckCircle },
      past_due: { variant: "destructive", label: "Past Due", icon: AlertCircle },
      canceled: { variant: "secondary", label: t("cancelled"), icon: XCircle },
      expired: { variant: "secondary", label: t("expired"), icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default", label: t("paid"), icon: CheckCircle },
      unpaid: { variant: "destructive", label: t("unpaid"), icon: AlertCircle },
      pending: { variant: "secondary", label: t("pending"), icon: AlertCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.paid;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAddPaymentMethod = () => {
    setIsAddPaymentMethodOpen(true);
  };

  const handleUpdateBilling = () => {
    setIsUpdateBillingOpen(true);
  };

  const handleCancelSubscription = () => {
    setIsCancelSubscriptionOpen(true);
  };

  const handleReactivateSubscription = () => {
    setSubscription((prev: any) => ({ ...prev, status: 'active', cancelAtPeriodEnd: false }));
    toast.success(t("billing.subscriptionReactivated"));
  };

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    if (confirm("Are you sure you want to remove this payment method?")) {
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      toast.success("Payment method removed");
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    // In real app, this would download the PDF
    window.open(invoice.pdfUrl, '_blank');
    toast.success("Invoice downloaded");
  };

  const handleViewInvoice = (invoice: any) => {
    // In real app, this would show invoice details
    toast.info("Invoice details would be displayed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("billing")}</h1>
            <p className="text-muted-foreground">{t("store.billing.description")}</p>
          </div>
        </div>

        {/* Current Subscription */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("billing.currentPlan")}
              </CardTitle>
              <CardDescription>{t("billing.planDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("plan")}:</span>
                    <Badge variant="outline" className="capitalize">
                      {subscription.plan} {t("plan")}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("billing.billingCycle")}:</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {subscription.interval}ly
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("billing.nextBilling")}:</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(subscription.nextBilling)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("status")}:</span>
                    {getSubscriptionStatusBadge(subscription.status)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {formatCurrency(subscription.price, subscription.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {subscription.interval}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    {subscription.status === 'active' && !subscription.cancelAtPeriodEnd ? (
                      <>
                        <Button variant="outline" onClick={handleUpdateBilling}>
                          {t("billing.updateBilling")}
                        </Button>
                        <Button variant="outline" onClick={handleCancelSubscription}>
                          {t("billing.cancelSubscription")}
                        </Button>
                      </>
                    ) : subscription.status === 'canceled' || subscription.cancelAtPeriodEnd ? (
                      <Button onClick={handleReactivateSubscription}>
                        {t("billing.reactivateSubscription")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("billing.paymentMethod")}
            </CardTitle>
            <CardDescription>{t("managePaymentMethods")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expires {method.expMonth}/{method.expYear}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      disabled={method.isDefault && paymentMethods.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                {t("billing.addPaymentMethod")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t("billing.invoiceHistory")}
            </CardTitle>
            <CardDescription>{t("viewAndDownloadInvoices")}</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("billing.noInvoices")}</p>
                <p className="text-sm">{t("billing.noInvoicesDescription")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoice")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
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
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
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

        {/* Add Payment Method Dialog */}
        <Dialog open={isAddPaymentMethodOpen} onOpenChange={setIsAddPaymentMethodOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("billing.addPaymentMethod")}</DialogTitle>
              <DialogDescription>
                {t("addNewPaymentMethod")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t("cardNumber")}</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiry">{t("expiryDate")}</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cvc">{t("cvc")}</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  placeholder={t("cardholderName")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPaymentMethodOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={() => {
                toast.success("Payment method added successfully");
                setIsAddPaymentMethodOpen(false);
              }}>
                {t("add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Billing Dialog */}
        <Dialog open={isUpdateBillingOpen} onOpenChange={setIsUpdateBillingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("billing.updateBilling")}</DialogTitle>
              <DialogDescription>
                {t("updateBillingInformation")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan">{t("plan")}</Label>
                <Select defaultValue={subscription?.plan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan - $29/month</SelectItem>
                    <SelectItem value="pro">Pro Plan - $99/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billingCycle">{t("billing.billingCycle")}</Label>
                <Select defaultValue={subscription?.interval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly (Save 20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateBillingOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={() => {
                toast.success("Billing updated successfully");
                setIsUpdateBillingOpen(false);
              }}>
                {t("update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={isCancelSubscriptionOpen} onOpenChange={setIsCancelSubscriptionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("billing.cancelSubscription")}</DialogTitle>
              <DialogDescription>
                {t("cancelSubscriptionWarning")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{t("warning")}</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  {t("cancelSubscriptionDescription")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">{t("cancellationReason")}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectReason")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="too_expensive">Too expensive</SelectItem>
                    <SelectItem value="not_using">Not using enough</SelectItem>
                    <SelectItem value="switching">Switching to competitor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback">{t("additionalFeedback")}</Label>
                <Textarea
                  id="feedback"
                  placeholder={t("optionalFeedback")}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelSubscriptionOpen(false)}>
                {t("keepSubscription")}
              </Button>
                              <Button 
                variant="destructive" 
                onClick={() => {
                  setSubscription((prev: any) => ({ ...prev, cancelAtPeriodEnd: true }));
                  toast.success(t("billing.subscriptionCancelled"));
                  setIsCancelSubscriptionOpen(false);
                }}
              >
                {t("cancelSubscription")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <BillingPageContent />
    </ProtectedRoute>
  );
}
