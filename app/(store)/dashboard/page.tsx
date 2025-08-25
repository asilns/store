"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Upload, Plus, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { useStore } from "@/lib/hooks/useStore";
import { StoreLoadingWrapper } from "@/components/store/StoreLoadingWrapper";
// import { useOrders, useProducts } from "@/lib/hooks/useStore";
import { formatCurrency } from "@/lib/services/supabaseService";

function SellerDashboardContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  
  return (
    <StoreLoadingWrapper>
      <DashboardContent />
    </StoreLoadingWrapper>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  
  // Use custom hooks for data management
  const { currentStore, stores } = useStore();
  console.log(currentStore)
  // const { orders, loading: ordersLoading } = useOrders(currentStore?.id || null);
  // const { products, loading: productsLoading } = useProducts(currentStore?.id || null);

  // Calculate KPIs from real data
  // const calculateKPIs = () => {
  //   if (!orders || !products) return { ordersToday: 0, ordersWeek: 0, gmv30d: 0, profit30d: 0 };

  //   const now = new Date();
  //   const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  //   const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  //   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  //   const ordersToday = orders.filter(order => {
  //     const orderDate = new Date(order.created_at);
  //     return orderDate >= today;
  //   }).length;

  //   const ordersWeek = orders.filter(order => {
  //     const orderDate = new Date(order.created_at);
  //     return orderDate >= sevenDaysAgo;
  //   }).length;

  //   const orders30d = orders.filter(order => {
  //     const orderDate = new Date(order.created_at);
  //     return orderDate >= thirtyDaysAgo;
  //   });

  //   const gmv30d = orders30d.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  //   const profit30d = orders30d.reduce((sum, order) => sum + (order.total_profit || 0), 0);

  //   return { ordersToday, ordersWeek, gmv30d, profit30d };
  // };

  // const kpis = calculateKPIs();

  // At this point, currentStore is guaranteed to be non-null due to StoreLoadingWrapper
  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" lang={locale}>
            {currentStore.name}
          </h1>
          <div className={`mt-2 flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" lang={locale}>Plan:</span>
              <Badge variant="outline">{currentStore.plan || 'basic'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" lang={locale}>Status:</span>
              <Badge variant={currentStore.status === 'active' ? 'default' : 'secondary'}>
                {currentStore.status || 'active'}
              </Badge>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-sm text-muted-foreground mt-1" lang={locale}>
              Store ID: <span className="select-all">{currentStore.id}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1" lang={locale}>
              Store Owner ID: <span className="select-all">{currentStore.owner_id}</span>
            </p>
          </div>
        </div>
      </div>

        {/* KPIs */}
        {/* <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.ordersToday}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.ordersToday === 0 ? 'No orders today' : `${kpis.ordersToday} order${kpis.ordersToday === 1 ? '' : 's'}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders (7d)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.ordersWeek}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GMV (30d)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.gmv30d)}</div>
              <p className="text-xs text-muted-foreground">Gross Merchandise Value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit (30d)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.profit30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.profit30d)}
              </div>
              <p className="text-xs text-muted-foreground">Net profit after costs</p>
            </CardContent>
          </Card>
        </div> */}

        {/* Recent Orders */}
        {/* <Card>
          <CardHeader>
            <CardTitle lang={locale}>Recent Orders</CardTitle>
            <CardDescription lang={locale}>
              Latest orders from your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground" lang={locale}>Loading orders...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Order #{order.orderNumber || order.id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.customerName || 'Anonymous Customer'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(order.totalAmount || 0)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => router.push('/orders')}>
                      View All Orders ({orders.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p lang={locale}>No orders yet</p>
                <p className="text-sm" lang={locale}>Create your first order</p>
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Products Summary */}
        {/* <Card>
          <CardHeader>
            <CardTitle lang={locale}>Products Overview</CardTitle>
            <CardDescription lang={locale}>
              Manage your store products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground" lang={locale}>Loading products...</p>
              </div>
            ) : products && products.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{products.length}</div>
                    <div className="text-sm text-muted-foreground">Total Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {products.filter(p => p.is_active).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {products.filter(p => !p.is_active).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Inactive Products</div>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => router.push('/products')}>
                    Manage Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p lang={locale}>No products yet</p>
                <p className="text-sm" lang={locale}>Add your first product to get started</p>
                <Button className="mt-4" onClick={() => router.push('/products')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
    );
  }

export default function SellerDashboard() {
  return (
    <ProtectedRoute redirectTo="/login">
      <SellerDashboardContent />
    </ProtectedRoute>
  );
}