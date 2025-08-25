"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Filter, Edit, Trash2, Eye, Download, Upload, Store, Users, ShoppingCart, DollarSign, AlertCircle, CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { z } from "zod";

// Zod schemas for validation
const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  plan: z.enum(["basic", "pro"]),
  status: z.enum(["active", "inactive", "suspended"]),
  ownerEmail: z.string().email("Invalid email address"),
  ownerName: z.string().min(1, "Owner name is required"),
});

const subscriptionSchema = z.object({
  plan: z.enum(["basic", "pro"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  graceDays: z.number().min(0, "Grace days must be non-negative"),
  autoRenew: z.boolean(),
});

function AdminStoresPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  
  // Form data
  const [storeFormData, setStoreFormData] = useState<{
    name: string;
    plan: "basic" | "pro";
    status: "active" | "inactive" | "suspended";
    ownerEmail: string;
    ownerName: string;
  }>({
    name: "",
    plan: "basic",
    status: "active",
    ownerEmail: "",
    ownerName: "",
  });
  
  const [subscriptionFormData, setSubscriptionFormData] = useState<{
    plan: "basic" | "pro";
    startDate: string;
    endDate: string;
    graceDays: number;
    autoRenew: boolean;
  }>({
    plan: "basic",
    startDate: "",
    endDate: "",
    graceDays: 7,
    autoRenew: true,
  });
  
  const [formErrors, setFormErrors] = useState<any>({});

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockStores = [
      {
        id: "1",
        name: "Tech Store",
        plan: "pro",
        status: "active",
        ownerName: "John Doe",
        ownerEmail: "john@techstore.com",
        created_at: new Date("2024-01-01"),
        subscription: {
          id: "sub_1",
          status: "active",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
          graceDays: 7,
          autoRenew: true,
        },
        stats: {
          products: 150,
          users: 8,
          orders30d: 45,
          gmv30d: 1250000,
          profit30d: 375000,
        }
      },
      {
        id: "2",
        name: "Fashion Boutique",
        plan: "basic",
        status: "active",
        ownerName: "Jane Smith",
        ownerEmail: "jane@fashionboutique.com",
        created_at: new Date("2024-01-05"),
        subscription: {
          id: "sub_2",
          status: "active",
          startDate: new Date("2024-01-05"),
          endDate: new Date("2024-02-05"),
          graceDays: 3,
          autoRenew: true,
        },
        stats: {
          products: 75,
          users: 5,
          orders30d: 28,
          gmv30d: 850000,
          profit30d: 255000,
        }
      },
      {
        id: "3",
        name: "Home Decor",
        plan: "pro",
        status: "suspended",
        ownerName: "Mike Johnson",
        ownerEmail: "mike@homedecor.com",
        created_at: new Date("2024-01-10"),
        subscription: {
          id: "sub_3",
          status: "past_due",
          startDate: new Date("2024-01-10"),
          endDate: new Date("2024-01-10"),
          graceDays: 7,
          autoRenew: false,
        },
        stats: {
          products: 200,
          users: 12,
          orders30d: 0,
          gmv30d: 0,
          profit30d: 0,
        }
      }
    ];
    
    setStores(mockStores);
    setLoading(false);
  }, []);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || store.status === statusFilter;
      const matchesPlan = planFilter === "all" || store.plan === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [stores, searchTerm, statusFilter, planFilter]);

  const formatCurrency = (cents: number) => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    const currency = locale === 'ar' ? 'QAR' : 'USD';
    return new Intl.NumberFormat(config, {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-US').format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default", label: t("active"), icon: CheckCircle },
      inactive: { variant: "secondary", label: t("inactive"), icon: Clock },
      suspended: { variant: "destructive", label: t("suspended"), icon: XCircle },
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

  const getSubscriptionStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default", label: t("active"), icon: CheckCircle },
      past_due: { variant: "destructive", label: "Past Due", icon: AlertCircle },
      expired: { variant: "secondary", label: t("expired"), icon: XCircle },
      canceled: { variant: "secondary", label: t("cancelled"), icon: XCircle },
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

  const handleCreateStore = () => {
    setStoreFormData({
      name: "",
      plan: "basic",
      status: "active",
      ownerEmail: "",
      ownerName: "",
    });
    setFormErrors({});
    setIsCreateStoreOpen(true);
  };

  const handleEditStore = (store: any) => {
    setEditingStore(store);
    setStoreFormData({
      name: store.name,
      plan: store.plan,
      status: store.status,
      ownerEmail: store.ownerEmail,
      ownerName: store.ownerName,
    });
    setFormErrors({});
    setIsEditStoreOpen(true);
  };

  const handleManageSubscription = (store: any) => {
    setSelectedStore(store);
    setSubscriptionFormData({
      plan: store.plan,
      startDate: store.subscription.startDate.toISOString().split('T')[0],
      endDate: store.subscription.endDate.toISOString().split('T')[0],
      graceDays: store.subscription.graceDays,
      autoRenew: store.subscription.autoRenew,
    });
    setIsSubscriptionOpen(true);
  };

  const handleDeleteStore = async (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store?.status === 'active') {
      toast.error("Cannot delete active stores. Suspend them first.");
      return;
    }
    
    if (confirm("Are you sure you want to delete this store? This action cannot be undone.")) {
      setStores(stores.filter(s => s.id !== storeId));
      toast.success("Store deleted successfully");
    }
  };

  const toggleStoreStatus = async (storeId: string, newStatus: string) => {
    setStores(stores.map(s => 
      s.id === storeId 
        ? { ...s, status: newStatus }
        : s
    ));
    toast.success(`Store status updated to ${newStatus}`);
  };

  const validateStoreForm = () => {
    try {
      storeSchema.parse(storeFormData);
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

  const handleStoreSubmit = async () => {
    if (!validateStoreForm()) return;

    if (editingStore) {
      // Update existing store
      setStores(stores.map(s => s.id === editingStore.id ? { ...s, ...storeFormData } : s));
      toast.success("Store updated successfully");
      setIsEditStoreOpen(false);
    } else {
      // Create new store
      const newStore = {
        id: Date.now().toString(),
        ...storeFormData,
        createdAt: new Date(),
        subscription: {
          id: `sub_${Date.now()}`,
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          graceDays: 7,
          autoRenew: true,
        },
        stats: {
          products: 0,
          users: 1,
          orders30d: 0,
          gmv30d: 0,
          profit30d: 0,
        }
      };
      setStores([newStore, ...stores]);
      toast.success("Store created successfully");
      setIsCreateStoreOpen(false);
    }
  };

  const handleSubscriptionSubmit = async () => {
    if (!validateSubscriptionForm()) return;

    // Update store subscription
    setStores(stores.map(s => 
      s.id === selectedStore.id 
        ? { 
            ...s, 
            plan: subscriptionFormData.plan,
            subscription: {
              ...s.subscription,
              ...subscriptionFormData,
              startDate: new Date(subscriptionFormData.startDate),
              endDate: new Date(subscriptionFormData.endDate),
            }
          }
        : s
    ));
    
    toast.success("Subscription updated successfully");
    setIsSubscriptionOpen(false);
  };

  const handleExportStores = () => {
    try {
      // Create CSV content
      const headers = ['Store Name', 'Plan', 'Status', 'Created Date', 'User Count', 'Subscription Status'];
      const csvContent = [
        headers.join(','),
        ...stores.map(store => [
          store.name,
          store.plan,
          store.status,
          store.created_at ? new Date(store.created_at).toLocaleDateString() : 'N/A',
          store.userCount || 0,
          store.subscriptionStatus || 'N/A'
        ].join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stores-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Stores exported successfully");
    } catch (error) {
      console.error('Error exporting stores:', error);
      toast.error("Failed to export stores");
    }
  };

  if (loading) {
    return (
      <AppShell sidebar={<AdminSidebar />} title={t("admin.stores.title")}>
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
    <AppShell sidebar={<AdminSidebar />} title={t("admin.stores.title")}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.stores.title")}</h1>
            <p className="text-muted-foreground">{t("admin.stores.description")}</p>
          </div>
          <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={handleExportStores}>
              <Download className="h-4 w-4 mr-2" />
              {t("export")}
            </Button>
            <Button onClick={handleCreateStore}>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.stores.newStore")}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalStores")}</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
              <p className="text-xs text-muted-foreground">
                {stores.filter(s => s.status === 'active').length} {t("active")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stores.reduce((sum, store) => sum + store.stats.users, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("acrossAllStores")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalOrders")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stores.reduce((sum, store) => sum + store.stats.orders30d, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("last30Days")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalGMV")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stores.reduce((sum, store) => sum + store.stats.gmv30d, 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("last30Days")}
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
                    placeholder={t("searchStores")}
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
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    <SelectItem value="suspended">{t("suspended")}</SelectItem>
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

        {/* Stores Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.stores.allStores")}</CardTitle>
            <CardDescription>
              {filteredStores.length} {t("stores")} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("noStoresFound")}</p>
                <p className="text-sm">{t("createFirstStore")}</p>
                <Button className="mt-4" onClick={handleCreateStore}>
                  {t("admin.stores.newStore")}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("store")}</TableHead>
                    <TableHead>{t("owner")}</TableHead>
                    <TableHead>{t("plan")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("subscription")}</TableHead>
                    <TableHead>{t("stats")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(store.created_at)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{store.ownerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {store.ownerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(store.plan)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(store.status)}
                          <Select 
                            value={store.status} 
                            onValueChange={(value) => toggleStoreStatus(store.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t("active")}</SelectItem>
                              <SelectItem value="inactive">{t("inactive")}</SelectItem>
                              <SelectItem value="suspended">{t("suspended")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getSubscriptionStatusBadge(store.subscription.status)}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(store.subscription.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            {store.stats.products} {t("products")}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {store.stats.users} {t("users")}
                          </div>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-3 w-3" />
                            {store.stats.orders30d} {t("orders")}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(store.stats.gmv30d)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageSubscription(store)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStore(store)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStore(store.id)}
                            disabled={store.status === 'active'}
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

        {/* Create/Edit Store Dialog */}
        <Dialog open={isCreateStoreOpen || isEditStoreOpen} onOpenChange={setIsCreateStoreOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStore ? t("editStore") : t("admin.stores.newStore")}
              </DialogTitle>
              <DialogDescription>
                {editingStore ? t("updateStoreInformation") : t("createNewStore")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">{t("storeName")}</Label>
                <Input
                  id="storeName"
                  value={storeFormData.name}
                  onChange={(e) => setStoreFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storePlan">{t("plan")}</Label>
                  <Select value={storeFormData.plan} onValueChange={(value: "basic" | "pro") => setStoreFormData(prev => ({ ...prev, plan: value }))}>
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
                  <Label htmlFor="storeStatus">{t("status")}</Label>
                  <Select value={storeFormData.status} onValueChange={(value: "active" | "inactive" | "suspended") => setStoreFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive")}</SelectItem>
                      <SelectItem value="suspended">{t("suspended")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerName">{t("ownerName")}</Label>
                <Input
                  id="ownerName"
                  value={storeFormData.ownerName}
                  onChange={(e) => setStoreFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className={formErrors.ownerName ? "border-red-500" : ""}
                />
                {formErrors.ownerName && (
                  <p className="text-sm text-red-500">{formErrors.ownerName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">{t("ownerEmail")}</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={storeFormData.ownerEmail}
                  onChange={(e) => setStoreFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  className={formErrors.ownerEmail ? "border-red-500" : ""}
                />
                {formErrors.ownerEmail && (
                  <p className="text-sm text-red-500">{formErrors.ownerEmail}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateStoreOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleStoreSubmit}>
                {editingStore ? t("update") : t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Subscription Dialog */}
        <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("manageSubscription")}</DialogTitle>
              <DialogDescription>
                {t("updateSubscriptionFor")} {selectedStore?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSubscriptionOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSubscriptionSubmit}>
                {t("update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

export default function AdminStoresPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminStoresPageContent />
    </ProtectedRoute>
  );
}
