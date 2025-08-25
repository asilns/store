import { useState, useEffect, useCallback } from 'react';
import { storeService, productService, orderService, invoiceService, userManagementService } from '@/lib/services/supabaseService';
import { Store, Product, Order, Invoice, UserStoreMap, StoreMapping, StoreUserRole } from '@/lib/types';
import { toast } from 'sonner';

export const useStore = () => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<StoreMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's stores
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeService.fetchStores();
      setStores(data);
      
      // Set current store to the first one if available
      if (data && data.length > 0 && data[0].stores) {
        setCurrentStore(data[0].stores);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stores';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new store
  const createStore = useCallback(async (storeData: Partial<Store>) => {
    try {
      setError(null);
      const newStore = await storeService.createStore(storeData);
      
      // Refresh stores list
      await fetchStores();
      
      toast.success('Store created successfully');
      return newStore;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create store';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [fetchStores]);

  // Update store
  const updateStore = useCallback(async (storeId: string, updateData: Partial<Store>) => {
    try {
      setError(null);
      const updatedStore = await storeService.updateStore(storeId, updateData);
      
      // Update local state
      setStores(prev => prev.map(item => 
        item.store_id === storeId 
          ? { ...item, stores: { ...item.stores, ...updateData } }
          : item
      ));
      
      if (currentStore?.id === storeId) {
        setCurrentStore(prev => prev ? { ...prev, ...updateData } : null);
      }
      
      toast.success('Store updated successfully');
      return updatedStore;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update store';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [currentStore]);

  // Delete store
  const deleteStore = useCallback(async (storeId: string) => {
    try {
      setError(null);
      await storeService.deleteStore(storeId);
      
      // Remove from local state
      setStores(prev => prev.filter(item => item.store_id !== storeId));
      
      if (currentStore?.id === storeId) {
        setCurrentStore(null);
      }
      
      toast.success('Store deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete store';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [currentStore]);

  // Set current store
  const setCurrentStoreById = useCallback((storeId: string) => {
    const store = stores.find(item => item.store_id === storeId);
    if (store?.stores) {
      setCurrentStore(store.stores);
    }
  }, [stores]);

  // Initialize on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return {
    currentStore,
    stores,
    loading,
    error,
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
    setCurrentStoreById,
    setCurrentStore
  };
};

export const useProducts = (storeId: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await productService.fetchProducts(storeId);
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createProduct = useCallback(async (productData: Partial<Product>) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const newProduct = await productService.createProduct(storeId, productData);
      
      // Add to local state
      setProducts(prev => [newProduct, ...prev]);
      
      toast.success('Product created successfully');
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const updateProduct = useCallback(async (productId: string, updateData: Partial<Product>) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const updatedProduct = await productService.updateProduct(storeId, productId, updateData);
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      
      toast.success('Product updated successfully');
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      await productService.deleteProduct(storeId, productId);
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      toast.success('Product deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  // Initialize on mount or when storeId changes
  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};

export const useOrders = (storeId: string | null) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.fetchOrders(storeId);
      setOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createOrder = useCallback(async (orderData: Partial<Order>, orderItems: any[]) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const newOrder = await orderService.createOrder(storeId, orderData, orderItems);
      
      // Add to local state
      setOrders(prev => [newOrder, ...prev]);
      
      toast.success('Order created successfully');
      return newOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const updateOrder = useCallback(async (order_id: string, updateData: Partial<Order>) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const updatedOrder = await orderService.updateOrder(storeId, order_id, updateData);
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order_id ? updatedOrder : o
      ));
      
      toast.success('Order updated successfully');
      return updatedOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const deleteOrder = useCallback(async (order_id: string) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      await orderService.deleteOrder(storeId, order_id);
      
      // Remove from local state
      setOrders(prev => prev.filter(o => o.id !== order_id));
      
      toast.success('Order deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  // Initialize on mount or when storeId changes
  useEffect(() => {
    if (storeId) {
      fetchOrders();
    }
  }, [storeId, fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder
  };
};

export const useInvoices = (storeId: string | null) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.fetchInvoices(storeId);
      setInvoices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createInvoice = useCallback(async (invoiceData: Partial<Invoice>) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const newInvoice = await invoiceService.createInvoice(storeId, invoiceData);
      
      // Add to local state
      setInvoices(prev => [newInvoice, ...prev]);
      
      toast.success('Invoice created successfully');
      return newInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const updateInvoice = useCallback(async (invoiceId: string, updateData: Partial<Invoice>) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const updatedInvoice = await invoiceService.updateInvoice(storeId, invoiceId, updateData);
      
      // Update local state
      setInvoices(prev => prev.map(i => 
        i.id === invoiceId ? updatedInvoice : i
      ));
      
      toast.success('Invoice updated successfully');
      return updatedInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      await invoiceService.deleteInvoice(storeId, invoiceId);
      
      // Remove from local state
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      
      toast.success('Invoice deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  // Initialize on mount or when storeId changes
  useEffect(() => {
    if (storeId) {
      fetchInvoices();
    }
  }, [storeId, fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice
  };
};

export const useStoreUsers = (storeId: string | null) => {
  const [users, setUsers] = useState<UserStoreMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreUsers = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await userManagementService.fetchStoreUsers(storeId);
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch store users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const inviteUser = useCallback(async (userData: { email: string; name: string; role: StoreUserRole }) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const newUser = await userManagementService.inviteUser(storeId, userData);
      
      // Refresh users list
      await fetchStoreUsers();
      
      toast.success('User invited successfully');
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId, fetchStoreUsers]);

  const updateUserRole = useCallback(async (userId: string, newRole: StoreUserRole) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      const updatedUser = await userManagementService.updateUserRole(storeId, userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success('User role updated successfully');
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  const removeUser = useCallback(async (userId: string) => {
    if (!storeId) throw new Error('No store selected');
    
    try {
      setError(null);
      await userManagementService.removeUser(storeId, userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      
      toast.success('User removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [storeId]);

  // Initialize on mount or when storeId changes
  useEffect(() => {
    if (storeId) {
      fetchStoreUsers();
    }
  }, [storeId, fetchStoreUsers]);

  return {
    users,
    loading,
    error,
    fetchStoreUsers,
    inviteUser,
    updateUserRole,
    removeUser
  };
};
