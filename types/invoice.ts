export interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string | Date;
  dueDate: string | Date;
  billTo: Address;
  shipTo: Address;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

// Legacy interface for backward compatibility
export interface LegacyInvoiceData {
  invoice_number: string;
  date: string;
  due_date: string;
  bill_to: Address;
  ship_to: Address;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}
