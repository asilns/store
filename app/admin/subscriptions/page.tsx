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
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Filter, Edit, Trash2, Eye, Download, Calendar, AlertCircle, CheckCircle, XCircle, Clock, CreditCard, DollarSign, TrendingUp, TrendingDown, Store, Users, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { z } from "zod";

// Zod schemas for validation
const subscriptionSchema = z.object({
  storeId: z.string().min(1, "Store is required"),
  plan: z.enum(["basic", "pro"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  graceDays: z.number().min(0, "Grace days must be non-negative"),
  autoRenew: z.boolean(),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.enum(["USD", "QAR"]),
});

function AdminSubscriptionsPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateSubscriptionOpen, setIsCreateSubscriptionOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [isDateEditOpen, setIsDateEditOpen] = useState(false);
  const [editingDates, setEditingDates] = useState<any>(null);
  const [dateFormData, setDateFormData] = useState<{
    startDate: string;
    endDate: string;
    graceDays: number;
  }>({
    startDate: "",
    endDate: "",
    graceDays: 7,
  });
  
  // Form data
  const [subscriptionFormData, setSubscriptionFormData] = useState<{
    store_id: string;
    plan: "basic" | "pro";
    startDate: string;
    endDate: string;
    graceDays: number;
    autoRenew: boolean;
    amount: number;
    currency: "USD" | "QAR";
  }>({
    store_id: "",
    plan: "basic",
    startDate: "",
    endDate: "",
    graceDays: 7,
    autoRenew: true,
    amount: 0,
    currency: "USD",
  });
  
  const [formErrors, setFormErrors] = useState<any>({});

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockStores = [
      { id: "1", name: "Tech Store" },
      { id: "2", name: "Fashion Boutique" },
      { id: "3", name: "Home Decor" },
    ];
    
    const mockSubscriptions = [
      {
        id: "sub_1",
        storeId: "1",
        storeName: "Tech Store",
        plan: "pro",
        status: "active",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        graceDays: 7,
        autoRenew: true,
        amount: 9999, // $99.99
        currency: "USD",
        lastBillingDate: new Date("2024-01-01"),
        nextBillingDate: new Date("2024-02-01"),
        paymentMethod: "card_visa",
        paymentStatus: "paid",
        usage: {
          products: 150,
          users: 8,
          orders: 45,
          storage: 2.5, // GB
        }
      },
      {
        id: "sub_2",
        storeId: "2",
        storeName: "Fashion Boutique",
        plan: "basic",
        status: "active",
        startDate: new Date("2024-01-05"),
        endDate: new Date("2024-02-05"),
        graceDays: 3,
        autoRenew: true,
        amount: 4999, // $49.99
        currency: "USD",
        lastBillingDate: new Date("2024-01-05"),
        nextBillingDate: new Date("2024-02-05"),
        paymentMethod: "card_mastercard",
        paymentStatus: "paid",
        usage: {
          products: 75,
          users: 5,
          orders: 28,
          storage: 1.2, // GB
        }
      },
      {
        id: "sub_3",
        storeId: "3",
        storeName: "Home Decor",
        plan: "pro",
        status: "past_due",
        startDate: new Date("2024-01-10"),
        endDate: new Date("2024-01-10"),
        graceDays: 7,
        autoRenew: false,
        amount: 9999, // $99.99
        currency: "USD",
        lastBillingDate: new Date("2024-01-10"),
        nextBillingDate: new Date("2024-02-10"),
        paymentMethod: "card_visa",
        paymentStatus: "failed",
        usage: {
          products: 200,
          users: 12,
          orders: 0,
          storage: 4.1, // GB
        }
      }
    ];
    
    setStores(mockStores);
    setSubscriptions(mockSubscriptions);
    setLoading(false);
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription => {
              const store = stores.find(s => s.id === subscription.store_id);
      const matchesSearch = 
        store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.plan.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
      const matchesPlan = planFilter === "all" || subscription.plan === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, stores, searchTerm, statusFilter, planFilter]);

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
      active: { variant: "default", label: t("active"), icon: CheckCircle },
      past_due: { variant: "destructive", label: t("pastDue"), icon: AlertCircle },
      expired: { variant: "secondary", label: t("expired"), icon: XCircle },
      canceled: { variant: "secondary", label: t("cancelled"), icon: XCircle },
      trialing: { variant: "outline", label: t("trialing"), icon: Clock },
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

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      basic: { variant: "outline", label: t("basicPlan") },
      pro: { variant: "default", label: t("proPlan") },
    };
    
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.basic;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default", label: t("paid"), icon: CheckCircle },
      pending: { variant: "outline", label: t("pending"), icon: Clock },
      failed: { variant: "destructive", label: t("failed"), icon: XCircle },
      refunded: { variant: "secondary", label: t("refunded"), icon: AlertCircle },
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

  const handleCreateSubscription = () => {
    setSubscriptionFormData({
      store_id: "",
      plan: "basic",
      startDate: "",
      endDate: "",
      graceDays: 7,
      autoRenew: true,
      amount: 0,
      currency: "USD",
    });
    setFormErrors({});
    setIsCreateSubscriptionOpen(true);
  };

  const handleEditSubscription = (subscription: any) => {
    setEditingSubscription(subscription);
    setSubscriptionFormData({
              store_id: subscription.store_id,
      plan: subscription.plan,
      startDate: subscription.startDate.toISOString().split('T')[0],
      endDate: subscription.endDate.toISOString().split('T')[0],
      graceDays: subscription.graceDays,
      autoRenew: subscription.autoRenew,
      amount: subscription.amount,
      currency: subscription.currency,
    });
    setFormErrors({});
    setIsEditSubscriptionOpen(true);
  };

  const handleEditDates = (subscription: any) => {
    setEditingDates(subscription);
    setDateFormData({
      startDate: subscription.startDate.toISOString().split('T')[0],
      endDate: subscription.endDate.toISOString().split('T')[0],
      graceDays: subscription.graceDays,
    });
    setIsDateEditOpen(true);
  };

  const handleDateUpdate = async () => {
    if (!editingDates) return;

    // Validate dates
    const startDate = new Date(dateFormData.startDate);
    const endDate = new Date(dateFormData.endDate);
    
    if (startDate >= endDate) {
      toast.error("End date must be after start date");
      return;
    }

    if (dateFormData.graceDays < 0) {
      toast.error("Grace days must be non-negative");
      return;
    }

    // Update subscription dates
    setSubscriptions(subscriptions.map(s => 
      s.id === editingDates.id 
        ? { 
            ...s, 
            startDate: startDate,
            endDate: endDate,
            graceDays: dateFormData.graceDays,
            // Recalculate next billing date if subscription is active
            nextBillingDate: s.status === 'active' ? 
              new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime())) : 
              s.nextBillingDate
          }
        : s
    ));

    toast.success("Subscription dates updated successfully");
    setIsDateEditOpen(false);
    setEditingDates(null);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    if (subscription?.status === 'active') {
      toast.error("Cannot delete active subscriptions. Cancel them first.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this subscription? This action cannot be undone.")) {
      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId));
      toast.success("Subscription deleted successfully");
    }
  };

  const toggleSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    setSubscriptions(subscriptions.map(s => 
      s.id === subscriptionId 
        ? { ...s, status: newStatus }
        : s
    ));
    toast.success(`Subscription status updated to ${newStatus}`);
  };

  const validateSubscriptionForm = () => {
    try {
      subscriptionSchema.parse(subscriptionFormData);
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

  const handleSubscriptionSubmit = async () => {
    if (!validateSubscriptionForm()) return;

    if (editingSubscription) {
      // Update existing subscription
      setSubscriptions(subscriptions.map(s => 
        s.id === editingSubscription.id 
          ? { 
              ...s, 
              ...subscriptionFormData,
              startDate: new Date(subscriptionFormData.startDate),
              endDate: new Date(subscriptionFormData.endDate),
            }
          : s
      ));
      toast.success("Subscription updated successfully");
      setIsEditSubscriptionOpen(false);
    } else {
      // Create new subscription
              const store = stores.find(s => s.id === subscriptionFormData.store_id);
      const newSubscription = {
        id: `sub_${Date.now()}`,
        ...subscriptionFormData,
        storeName: store?.name || "Unknown Store",
        status: "active",
        startDate: new Date(subscriptionFormData.startDate),
        endDate: new Date(subscriptionFormData.endDate),
        lastBillingDate: new Date(subscriptionFormData.startDate),
        nextBillingDate: new Date(subscriptionFormData.startDate),
        paymentMethod: "card_visa",
        paymentStatus: "paid",
        usage: {
          products: 0,
          users: 1,
          orders: 0,
          storage: 0,
        }
      };
      setSubscriptions([newSubscription, ...subscriptions]);
      toast.success("Subscription created successfully");
      setIsCreateSubscriptionOpen(false);
    }
  };

  const handleExportSubscriptions = () => {
    try {
      // Create CSV content
      const headers = ['Store', 'Plan', 'Status', 'Start Date', 'End Date', 'Amount', 'Currency', 'Auto Renew', 'Grace Days'];
      const csvContent = [
        headers.join(','),
        ...subscriptions.map(sub => [
          sub.storeName,
          sub.plan,
          sub.status,
          sub.startDate.toLocaleDateString(),
          sub.endDate.toLocaleDateString(),
          (sub.amount / 100).toFixed(2),
          sub.currency,
          sub.autoRenew ? 'Yes' : 'No',
          sub.graceDays
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Subscriptions exported successfully");
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      toast.error("Failed to export subscriptions");
    }
  };

  const handleRefreshSubscriptions = async () => {
    // In real app, this would call the API to refresh subscription statuses
    toast.info("Refreshing subscriptions...");
    // Simulate API call
    setTimeout(() => {
      toast.success("Subscriptions refreshed successfully");
    }, 2000);
  };

  if (loading) {
    return (
      <AppShell sidebar={<AdminSidebar />} title={t("admin.subscriptions.title")}>
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
    <AppShell sidebar={<AdminSidebar />} title={t("admin.subscriptions.title")}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.subscriptions.title")}</h1>
            <p className="text-muted-foreground">{t("admin.subscriptions.description")}</p>
          </div>
          <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={handleRefreshSubscriptions}>
              <Calendar className="h-4 w-4 mr-2" />
              {t("refresh")}
            </Button>
            <Button variant="outline" onClick={handleExportSubscriptions}>
              <Download className="h-4 w-4 mr-2" />
              {t("export")}
            </Button>
            <Button onClick={handleCreateSubscription}>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.subscriptions.newSubscription")}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalSubscriptions")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                {subscriptions.filter(s => s.status === 'active').length} {t("active")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("monthlyRevenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  subscriptions
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => sum + s.amount, 0),
                  "USD"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("fromActiveSubscriptions")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("pastDue")}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.filter(s => s.status === 'past_due').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("requiresAttention")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("expiringSoon")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.filter(s => {
                  const daysUntilExpiry = Math.ceil((s.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("next30Days")}
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
                    placeholder={t("searchSubscriptions")}
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
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="past_due">{t("pastDue")}</SelectItem>
                    <SelectItem value="expired">{t("expired")}</SelectItem>
                    <SelectItem value="canceled">{t("cancelled")}</SelectItem>
                    <SelectItem value="trialing">{t("trialing")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-filter">{t("filterByPlan")}</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filterByPlan")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="basic">{t("basicPlan")}</SelectItem>
                    <SelectItem value="pro">{t("proPlan")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.subscriptions.allSubscriptions")}</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} {t("subscriptions")} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("noSubscriptionsFound")}</p>
                <p className="text-sm">{t("createFirstSubscription")}</p>
                <Button className="mt-4" onClick={handleCreateSubscription}>
                  {t("admin.subscriptions.newSubscription")}
                </Button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("store")}</TableHead>
                    <TableHead>{t("plan")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("billing")}</TableHead>
                    <TableHead>{t("payment")}</TableHead>
                    <TableHead>{t("usage")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.storeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPlanBadge(subscription.plan)}
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(subscription.amount, subscription.currency)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(subscription.status)}
                          <Select 
                            value={subscription.status} 
                            onValueChange={(value) => toggleSubscriptionStatus(subscription.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t("active")}</SelectItem>
                              <SelectItem value="past_due">{t("pastDue")}</SelectItem>
                              <SelectItem value="expired">{t("expired")}</SelectItem>
                              <SelectItem value="canceled">{t("cancelled")}</SelectItem>
                              <SelectItem value="trialing">{t("trialing")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t("nextBilling")}: </span>
                            {formatDate(subscription.nextBillingDate)}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t("graceDays")}: </span>
                            {subscription.graceDays}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t("autoRenew")}: </span>
                            {subscription.autoRenew ? t("enabled") : t("disabled")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPaymentStatusBadge(subscription.paymentStatus)}
                          <div className="text-sm text-muted-foreground">
                            {getPaymentMethodIcon(subscription.paymentMethod)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(subscription.lastBillingDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            {subscription.usage.products} {t("products")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {subscription.usage.users} {t("users")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Store className="h-3 w-3" />
                            {subscription.usage.storage} GB
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDates(subscription)}
                            title={t("editDates")}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubscription(subscription)}
                            title={t("editSubscription")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            disabled={subscription.status === 'active'}
                            title={t("deleteSubscription")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Subscription Dialog */}
        <Dialog open={isCreateSubscriptionOpen || isEditSubscriptionOpen} onOpenChange={(open) => {
          if (!open) {
            if (editingSubscription) {
              setIsEditSubscriptionOpen(false);
              setEditingSubscription(null);
            } else {
              setIsCreateSubscriptionOpen(false);
            }
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubscription ? t("editSubscription") : t("admin.subscriptions.newSubscription")}
              </DialogTitle>
              <DialogDescription>
                {editingSubscription ? t("updateSubscriptionInformation") : t("createNewSubscription")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeSelect">{t("store")}</Label>
                <Select value={subscriptionFormData.store_id} onValueChange={(value) => setSubscriptionFormData(prev => ({ ...prev, store_id: value }))}>
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
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">{t("plan")}</Label>
                  <Select value={subscriptionFormData.plan} onValueChange={(value: "basic" | "pro") => setSubscriptionFormData(prev => ({ ...prev, plan: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{t("basicPlan")}</SelectItem>
                      <SelectItem value="pro">{t("proPlan")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subscriptionCurrency">{t("currency")}</Label>
                  <Select value={subscriptionFormData.currency} onValueChange={(value: "USD" | "QAR") => setSubscriptionFormData(prev => ({ ...prev, currency: value }))}>
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
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("startDate")}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={subscriptionFormData.startDate}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className={formErrors.startDate ? "border-red-500" : ""}
                  />
                  {formErrors.startDate && (
                    <p className="text-sm text-red-500">{formErrors.startDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("endDate")}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={subscriptionFormData.endDate}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className={formErrors.endDate ? "border-red-500" : ""}
                  />
                  {formErrors.endDate && (
                    <p className="text-sm text-red-500">{formErrors.endDate}</p>
                  )}
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t("amount")}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={subscriptionFormData.amount / 100}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, amount: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                    className={formErrors.amount ? "border-red-500" : ""}
                  />
                  {formErrors.amount && (
                    <p className="text-sm text-red-500">{formErrors.amount}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="graceDays">{t("graceDays")}</Label>
                  <Input
                    id="graceDays"
                    type="number"
                    value={subscriptionFormData.graceDays}
                    onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, graceDays: parseInt(e.target.value) || 0 }))}
                    className={formErrors.graceDays ? "border-red-500" : ""}
                  />
                  {formErrors.graceDays && (
                    <p className="text-sm text-red-500">{formErrors.graceDays}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="autoRenew">{t("autoRenew")}</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRenew"
                    checked={subscriptionFormData.autoRenew}
                    onCheckedChange={(checked) => setSubscriptionFormData(prev => ({ ...prev, autoRenew: checked }))}
                  />
                  <Label htmlFor="autoRenew">{subscriptionFormData.autoRenew ? t("enabled") : t("disabled")}</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                if (editingSubscription) {
                  setIsEditSubscriptionOpen(false);
                  setEditingSubscription(null);
                } else {
                  setIsCreateSubscriptionOpen(false);
                }
              }}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSubscriptionSubmit}>
                {editingSubscription ? t("update") : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Date Edit Dialog */}
        <Dialog open={isDateEditOpen} onOpenChange={setIsDateEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editSubscriptionDates")}</DialogTitle>
              <DialogDescription>
                {t("updateSubscriptionDatesDescription")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">{t("startDate")}</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={dateFormData.startDate}
                    onChange={(e) => setDateFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEndDate">{t("endDate")}</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={dateFormData.endDate}
                    onChange={(e) => setDateFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editGraceDays">{t("graceDays")}</Label>
                <Input
                  id="editGraceDays"
                  type="number"
                  min="0"
                  value={dateFormData.graceDays}
                  onChange={(e) => setDateFormData(prev => ({ ...prev, graceDays: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDateEditOpen(false);
                setEditingDates(null);
              }}>
                {t("cancel")}
              </Button>
              <Button onClick={handleDateUpdate}>
                {t("updateDates")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminSubscriptionsPageContent />
    </ProtectedRoute>
  );
}
