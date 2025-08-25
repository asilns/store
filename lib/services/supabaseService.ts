import supabase from '@/lib/supabase/client';
import { Store, Product, Order, OrderItem, Invoice, UserStoreMap, StoreUserRole } from '@/lib/types';

// Authentication Layer - Standalone functions (not hooks)
export const checkUserRole = async (storeId: string): Promise<StoreUserRole | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: roleData, error } = await supabase
    .from('user_store_map')
    .select('role')
    .eq('user_id', user.id)
    .eq('store_id', storeId)
    .single();

  if (error) throw error;
  return roleData.role;
};

export const checkSuperAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: adminData, error } = await supabase
    .from('user_store_map')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')
    .single();

  return !!adminData;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Role-Based Access Control (RBAC) Middleware
export const checkAccess = async (
  storeId: string, 
  requiredRoles: StoreUserRole[], 
  operation: 'read' | 'create' | 'update' | 'delete'
): Promise<boolean> => {
  const userRole = await checkUserRole(storeId);

  if (!userRole) return false;

  const roleHierarchy = {
    'owner': ['owner', 'admin', 'manager', 'staff', 'viewer'],
    'admin': ['admin', 'manager', 'staff', 'viewer'],
    'manager': ['manager', 'staff', 'viewer'],
    'staff': ['staff', 'viewer'],
    'viewer': ['viewer']
  };

  const operationRoleMap = {
    'read': ['viewer', 'staff', 'manager', 'admin', 'owner'],
    'create': ['manager', 'admin', 'owner'],
    'update': ['manager', 'admin', 'owner'],
    'delete': ['admin', 'owner']
  };

  const hasAccess = requiredRoles.some(role => 
    roleHierarchy[userRole]?.includes(role) && 
    operationRoleMap[operation].includes(role)
  );

  if (!hasAccess) {
    throw new Error('Insufficient permissions');
  }

  return true;
};

// Store Operations
export const storeService = {
  async fetchStores() {
    console.log('=== STARTING FETCH STORES ===');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // First get the user's store mappings
    const { data: mappings, error: mappingsError } = await supabase
      .from('user_store_map')
      .select('store_id, role')
      .eq('user_id', user.id);
    
    console.log('mappings', mappings);

    if (mappingsError) throw mappingsError;
    if (!mappings || mappings.length === 0) return [];

    // Get the store IDs
    const storeIds = mappings.map(m => m.store_id);

    // Fetch the stores data
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .in('id', storeIds);

    if (storesError) throw storesError;

    // Combine the data
    return mappings.map(mapping => {
      const store = stores?.find(s => s.id === mapping.store_id);
      return {
        store_id: mapping.store_id,
        role: mapping.role,
        stores: store
      };
    }).filter(item => item.stores); // Only include items where store data was found
  },

  async createStore(storeData: Partial<Store>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('stores')
      .insert([{ ...storeData, owner_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStore(storeId: string, updateData: Partial<Store>) {
    await checkAccess(storeId, ['owner', 'admin'], 'update');
    
    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStore(storeId: string) {
    await checkAccess(storeId, ['owner'], 'delete');
    
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) throw error;
    return { success: true };
  }
};

// Product Operations
export const productService = {
  async fetchProducts(storeId: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProduct(storeId: string, productData: Partial<Product>) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'create');
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...productData, store_id: storeId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(storeId: string, productId: string, updateData: Partial<Product>) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'update');
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProduct(storeId: string, productId: string) {
    await checkAccess(storeId, ['owner', 'admin'], 'delete');
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return { success: true };
  },

  async checkSKUUniqueness(storeId: string, sku: string, excludeId?: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    let query = supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('sku', sku);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return !data; // Return true if SKU is unique (no data found)
  }
};

// Order Operations
export const orderService = {
  async fetchOrders(storeId: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          quantity,
          unit_cost_cents,
          commission_bps,
          commission_cents,
          profit_cents,
          products(name, sku)
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createOrder(storeId: string, orderData: Partial<Order>, orderItems: Partial<OrderItem>[]) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'create');
    
    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ ...orderData, store_id: storeId }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw itemsError;

    return order;
  },

  async updateOrder(storeId: string, order_id: string, updateData: Partial<Order>) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'update');
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOrder(storeId: string, order_id: string) {
    await checkAccess(storeId, ['owner', 'admin'], 'delete');
    
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', order_id);

    if (error) throw error;
    return { success: true };
  }
};

// Order Items Operations
export const orderItemService = {
  async fetchOrderItems(order_id: string) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id);

    if (error) throw error;
    return data;
  },

  async createOrderItems(orderItems: Partial<OrderItem>[]) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (error) throw error;
    return data;
  },

  async updateOrderItem(itemId: string, updateData: Partial<OrderItem>) {
    const { data, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOrderItem(itemId: string) {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return { success: true };
  }
};

// Invoice Operations
export const invoiceService = {
  async fetchInvoices(storeId: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createInvoice(storeId: string, invoiceData: Partial<Invoice>) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'create');
    
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...invoiceData, store_id: storeId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInvoice(storeId: string, invoiceId: string, updateData: Partial<Invoice>) {
    await checkAccess(storeId, ['owner', 'admin', 'manager'], 'update');
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInvoice(storeId: string, invoiceId: string) {
    await checkAccess(storeId, ['owner', 'admin'], 'delete');
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
    return { success: true };
  },

  async generateInvoiceNumber(storeId: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    const { data, error } = await supabase
      .from('invoices')
      .select('number')
      .eq('store_id', storeId)
      .order('number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      return `INV-${storeId.slice(0, 8)}-001`;
    }

    const lastNumber = parseInt(data.number.split('-').pop() || '0');
    return `INV-${storeId.slice(0, 8)}-${String(lastNumber + 1).padStart(3, '0')}`;
  }
};

// User Management (Store Management)
export const userManagementService = {
  async fetchStoreUsers(storeId: string) {
    await checkAccess(storeId, ['viewer', 'staff', 'manager', 'admin', 'owner'], 'read');
    
    const { data, error } = await supabase
      .from('user_store_map')
      .select(`
        id,
        user_id,
        store_id,
        role,
        created_at,
        updated_at,
        users!inner(id, email, name, created_at)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match UserStoreMap interface
    return data?.map(item => ({
      id: item.id,
      user_id: item.user_id,
      store_id: item.store_id,
      role: item.role,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user: {
        id: item.users[0]?.id || '',
        email: item.users[0]?.email || '',
        name: item.users[0]?.name || '',
        created_at: item.users[0]?.created_at || new Date()
      }
    })) || [];
  },

  async inviteUser(storeId: string, userData: { email: string; name: string; role: StoreUserRole }) {
    await checkAccess(storeId, ['owner', 'admin'], 'create');
    
    // Use the RPC function for inviting users
    const { data, error } = await supabase.rpc('invite_user_tx', {
      p_email: userData.email,
      p_name: userData.name,
      p_store_id: storeId,
      p_role: userData.role
    });

    if (error) throw error;
    return data;
  },

  async updateUserRole(storeId: string, userId: string, newRole: StoreUserRole) {
    await checkAccess(storeId, ['owner', 'admin'], 'update');
    
    const { data, error } = await supabase
      .from('user_store_map')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeUser(storeId: string, userId: string) {
    await checkAccess(storeId, ['owner', 'admin'], 'delete');
    
    const { error } = await supabase
      .from('user_store_map')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId);

    if (error) throw error;
    return { success: true };
  }
};

// Admin Operations
export const adminService = {
  async fetchAllStores() {
    const isSuperAdmin = await checkSuperAdmin();
    
    if (!isSuperAdmin) throw new Error('Insufficient permissions');
    
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        user_store_map(user_id, role, users(name, email)),
        subscriptions(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async fetchAllSubscriptions() {
    const isSuperAdmin = await checkSuperAdmin();
    
    if (!isSuperAdmin) throw new Error('Insufficient permissions');
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stores(id, name, status)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async fetchAllUsers() {
    const isSuperAdmin = await checkSuperAdmin();
    
    if (!isSuperAdmin) throw new Error('Insufficient permissions');
    
    const { data, error } = await supabase
      .from('user_store_map')
      .select(`
        *,
        stores(id, name, status)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async refreshSubscriptions() {
    const isSuperAdmin = await checkSuperAdmin();
    
    if (!isSuperAdmin) throw new Error('Insufficient permissions');
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stores!inner(id, name, status)
      `)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }
};

// Error Handling Interceptor
export const createSupabaseClient = () => {
  // The client is already created in the imported supabase instance
  // This function can be used to add interceptors if needed in the future
  return supabase;
};

// Utility Functions
export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
