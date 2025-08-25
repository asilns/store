"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Download, Upload, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { useStore, useOrders } from "@/lib/hooks/useStore";
import { Order, StoreOrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/services/supabaseService";
import { toast } from "sonner";
import { StoreLoadingWrapper } from "@/components/store/StoreLoadingWrapper";

function OrdersPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  
  return (
    <StoreLoadingWrapper>
      <OrdersContent />
    </StoreLoadingWrapper>
  );
}

function OrdersContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  
  // Use custom hooks for data management
  const { currentStore } = useStore();
  const { 
    orders, 
    loading, 
    error, 
    createOrder, 
    updateOrder, 
    deleteOrder 
  } = useOrders(currentStore?.id || null);

  // At this point, currentStore is guaranteed to be non-null due to StoreLoadingWrapper
  if (!currentStore) return null;

  // Local state for modals and forms
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    status: "pending" as StoreOrderStatus,
    notes: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter orders based on search and status
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.order_number?.toString() || '').includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateOrder = () => {
    setFormData({
      customer_name: "",
      status: "pending",
      notes: ""
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name || "",
      status: order.status,
      notes: ""
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (order: Order) => {
    setDeletingOrder(order);
    setIsDeleteModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.customer_name.trim()) {
      errors.customer_name = 'Customer name is required';
    }
    
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await createOrder({
        customer_name: formData.customer_name.trim(),
        status: formData.status,
        total_amount: 0, // Will be calculated from order items
        total_profit: 0  // Will be calculated from order items
      }, []); // Empty order items for now
      
      setIsCreateModalOpen(false);
      setFormData({
        customer_name: "",
        status: "pending",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingOrder || !validateForm()) return;
    
    try {
      await updateOrder(editingOrder.id, {
        customer_name: formData.customer_name.trim(),
        status: formData.status
      });
      
      setIsEditModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return;
    
    try {
      await deleteOrder(deletingOrder.id);
      setIsDeleteModalOpen(false);
      setDeletingOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const getStatusBadge = (status: StoreOrderStatus) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      shipping: "secondary",
      completed: "default",
      canceled: "destructive",
      draft: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground" lang={locale}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-destructive">Error: {error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" lang={locale}>
            {t("orders")}
          </h1>
          <p className="text-muted-foreground" lang={locale}>
            Manage your store orders
          </p>
        </div>
        <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateOrder}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className={`grid gap-4 md:grid-cols-3 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search orders..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Total Orders</Label>
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="h-12 w-12 mx-auto mb-4 opacity-50">
                <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p>No orders found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first order to get started'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button className="mt-4" onClick={handleCreateOrder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number || order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name || 'Anonymous Customer'}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_id || 'No customer ID'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{formatCurrency(order.total_amount || 0)}</TableCell>
                    <TableCell>{formatDate(order.created_at.toString())}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(order)}>
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

      {/* Create Order Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Create a new order for your store
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createCustomerName">Customer Name *</Label>
              <Input
                id="createCustomerName"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className={formErrors.customer_name ? 'border-destructive' : ''}
              />
              {formErrors.customer_name && (
                <p className="text-sm text-destructive">{formErrors.customer_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="createStatus">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: StoreOrderStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createNotes">Notes</Label>
              <Textarea
                id="createNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about the order..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit}>
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCustomerName">Customer Name *</Label>
              <Input
                id="editCustomerName"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className={formErrors.customer_name ? 'border-destructive' : ''}
              />
              {formErrors.customer_name && (
                <p className="text-sm text-destructive">{formErrors.customer_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: StoreOrderStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about the order..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
                              Are you sure you want to delete order #{deletingOrder?.order_number || deletingOrder?.id.slice(0, 8)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
