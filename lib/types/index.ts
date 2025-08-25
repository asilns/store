// Store User Role
export type StoreUserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';

// System User Role
export type SystemUserRole = 'super_admin' | 'system_admin';

// Subscription Plan
export type Plan = 'basic' | 'pro';

/* 
  Subscription Plan Status
  Represents the lifecycle state of a store subscription plan
*/
export type PlanStatus =
  | 'trial'        // Store is in a free trial period, not yet paying
  | 'active'       // Subscription is active and payments are up-to-date
  | 'past_due'     // A payment attempt has failed (e.g., card declined)
  | 'grace_period' // Payment failed but store still has temporary access to fix billing
  | 'expired';     // Subscription ended naturally (trial or paid term finished, no renewal)


export type StoreStatus = 'active' | 'inactive' | 'suspended';

// Invoice Payment Status
export type InvoicePaymentStatus = 'paid' | 'unpaid';

export type ProductStatus = 'active' | 'inactive';

// Store Order Status
export type StoreOrderStatus =
  | 'draft'      // Order created but not submitted
  | 'pending'    // Order placed, awaiting payment or confirmation
  | 'shipping'    // Order shipping to customer
  | 'completed'  // Order delivered / completed successfully
  | 'canceled';   // Order canceled before completion

// User (Regular user not related to Store)
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// System User (for super admin access)
export interface SystemUser {
  id: string;
  user_id: string;
  role: SystemUserRole;
  created_at: Date;
  updated_at: Date;
}

// Store User (with Role)
export interface UserStoreMap {
  id: string;
  user_id: string;
  store_id: string;
  role: StoreUserRole;
  created_at: Date;
  updated_at: Date;
  name: string;
  email: string;
}

// Store Mapping (for user_store_map with store data)
export interface StoreMapping {
  store_id: string;
  role: StoreUserRole;
  stores: Store;
}

// Store
export interface Store {
  id: string;
  name: string;
  plan: Plan;
  status: StoreStatus;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

// Store Subscription
export interface Subscription {
  id: string;
  store_id: string;
  plan: Plan;
  status: PlanStatus;
  start_date: Date;
  end_date: Date;
  grace_period_end?: Date;
  created_at: Date;
  updated_at: Date;
}

/*
  Invoice.
  Invoice to a company for plan/subscription.
*/
export interface Invoice {
  id: string;
  store_id: string;
  plan: Plan;
  number: string;
  amount: number;
  status: InvoicePaymentStatus;
  pdf_url: string;
  created_at: Date;
  updated_at: Date;
}

/*
  Product.
  Single product, may be related to many stores and orders.
*/
export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  price_cents: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Order
export interface Order {
  id: string;
  store_id: string;
  order_number?: number;
  customer_name?: string;
  customer_id?: string;
  status: StoreOrderStatus;
  total_amount: number;
  total_profit: number;
  created_at: Date;
  updated_at: Date;
}

/*
  Order Items.
  Linked to:
    1. Particular order by orderId.
    2. Particular product by productId.
*/
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  commission: number;
  profit: number;
  created_at: Date;
  updated_at: Date;
}

// Shipment Status
export type ShipmentStatus =
  | 'created'        // Shipment record created, not yet sent to carrier
  | 'label_generated' // Carrier returned a label
  | 'in_transit'     // Carrier picked up / in transit
  | 'delivered'      // Delivered successfully
  | 'canceled';      // Shipment canceled

/*
  Shipment.
  A delivery entity linked to an order, managed via a pluggable provider.
*/
export interface Shipment {
  id: string;
  store_id: string;
  order_id: string;
  carrier: string;           // e.g., "DHL", "UPS", "FedEx"
  status: ShipmentStatus;
  tracking_number?: string;   // Carrier-provided tracking number
  label_url?: string;         // URL to download the shipping label (PDF, PNG, etc.)
  external_id?: string;       // Carrier's shipment ID for API calls
  created_at: Date;
  updated_at: Date;
}

// User Management Types
export interface InviteUserRequest {
  email: string;
  name: string;
  role: StoreUserRole;
}

export interface UpdateUserRoleRequest {
  user_id: string;
  role: StoreUserRole;
}

export interface RemoveUserRequest {
  user_id: string;
}
