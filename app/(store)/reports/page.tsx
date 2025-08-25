"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Download, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

function ReportsPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    to: new Date(), // Today
  });
  const [reportType, setReportType] = useState<string>("sales");

  // Mock data - in real app this would come from API based on date range
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dateRange]);

  const formatCurrency = (cents: number) => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    const currency = locale === 'ar' ? 'QAR' : 'USD';
    return new Intl.NumberFormat(config, {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    const config = locale === 'ar' ? 'ar-QA' : 'en-US';
    return new Intl.NumberFormat(config).format(num);
  };

  // Mock sales data
  const salesData = [
    { month: "Jan", sales: 1200000, orders: 45, profit: 400000 },
    { month: "Feb", sales: 1500000, orders: 52, profit: 500000 },
    { month: "Mar", sales: 1800000, orders: 61, profit: 600000 },
    { month: "Apr", sales: 1600000, orders: 58, profit: 550000 },
    { month: "May", sales: 2000000, orders: 68, profit: 700000 },
    { month: "Jun", sales: 2200000, orders: 75, profit: 800000 },
  ];

  // Mock product performance data
  const productPerformance = [
    { name: "iPhone 15 Pro", sales: 450000, units: 15, profit: 150000 },
    { name: "Nike Air Max", sales: 300000, units: 40, profit: 120000 },
    { name: "Samsung Galaxy", sales: 280000, units: 12, profit: 100000 },
    { name: "MacBook Pro", sales: 250000, units: 8, profit: 80000 },
    { name: "AirPods Pro", sales: 200000, units: 25, profit: 70000 },
  ];

  // Mock customer data
  const customerData = [
    { name: "John Doe", orders: 8, totalSpent: 450000, lastOrder: "2024-01-15" },
    { name: "Jane Smith", orders: 6, totalSpent: 380000, lastOrder: "2024-01-12" },
    { name: "Mike Johnson", orders: 5, totalSpent: 320000, lastOrder: "2024-01-10" },
    { name: "Sarah Wilson", orders: 4, totalSpent: 280000, lastOrder: "2024-01-08" },
    { name: "David Brown", orders: 3, totalSpent: 220000, lastOrder: "2024-01-05" },
  ];

  // Mock category distribution
  const categoryData = [
    { name: "Electronics", value: 45, color: "#8884d8" },
    { name: "Clothing", value: 25, color: "#82ca9d" },
    { name: "Home & Garden", value: 20, color: "#ffc658" },
    { name: "Sports", value: 10, color: "#ff7300" },
  ];

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
    const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      totalProfit,
      averageOrderValue,
    };
  }, [salesData]);

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    // In real app, this would trigger a new API call
  };

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
  };

  const handleGenerateReport = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return;
    }
    
    // In real app, this would generate and download the report
    toast.success(t("report.reportGenerated"));
  };

  const handleExportReport = () => {
    // In real app, this would export the report
    toast.info("Export functionality coming soon");
  };

  const handlePrintReport = () => {
    // In real app, this would print the report
    window.print();
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
            <h1 className="text-3xl font-bold tracking-tight">{t("reports")}</h1>
            <p className="text-muted-foreground">{t("store.reports.description")}</p>
          </div>
          <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={handlePrintReport}>
              <Download className="h-4 w-4 mr-2" />
              {t("report.printReport")}
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              {t("report.exportReport")}
            </Button>
            <Button onClick={handleGenerateReport}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {t("report.generateReport")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className={`grid gap-4 md:grid-cols-3 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="space-y-2">
                <Label>{t("report.reportType")}</Label>
                <Select value={reportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">{t("report.salesReport")}</SelectItem>
                    <SelectItem value="inventory">{t("report.inventoryReport")}</SelectItem>
                    <SelectItem value="customer">{t("report.customerReport")}</SelectItem>
                    <SelectItem value="profit">{t("report.profitReport")}</SelectItem>
                    <SelectItem value="commission">{t("report.commissionReport")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t("report.startDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "PPP", { locale: locale === 'ar' ? ar : enUS })
                      ) : (
                        <span>{t("select")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => handleDateRangeChange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>{t("report.endDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "PPP", { locale: locale === 'ar' ? ar : enUS })
                      ) : (
                        <span>{t("select")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => handleDateRangeChange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("report.totalSales")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% {t("fromLastMonth")}
                </span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("report.totalOrders")}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalOrders)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% {t("fromLastMonth")}
                </span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("report.averageOrderValue")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5% {t("fromLastMonth")}
                </span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("report.totalProfit")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryMetrics.totalProfit)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15% {t("fromLastMonth")}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sales Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("report.salesTrend")}</CardTitle>
              <CardDescription>{t("monthlySalesPerformance")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t("report.topProducts")}</CardTitle>
              <CardDescription>{t("salesByCategory")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Product Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("report.topProducts")}</CardTitle>
            <CardDescription>{t("bestPerformingProducts")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productPerformance.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatNumber(product.units)} {t("units")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(product.sales)}</div>
                    <div className="text-sm text-green-600">
                      +{formatCurrency(product.profit)} {t("profit")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("report.topCustomers")}</CardTitle>
            <CardDescription>{t("bestCustomers")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.orders} {t("orders")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("lastOrder")}: {customer.lastOrder}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profit Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>{t("report.profitTrend")}</CardTitle>
            <CardDescription>{t("monthlyProfitAnalysis")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="profit" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <ReportsPageContent />
    </ProtectedRoute>
  );
}
