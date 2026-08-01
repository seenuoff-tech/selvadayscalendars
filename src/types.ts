export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  sno: number;
  name: string;
  price?: number;
  imageUrl: string;
  enabled: boolean;
  description?: string;
  category?: string;
  sortOrder: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  sno?: number;
  productName: string;
  qty: number;
  unitPrice?: number;
  imageUrl?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  mobileNumber: string;
  city: string;
  items: OrderItem[];
  totalQty: number;
  totalPrice?: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface AdminAuth {
  isAuthenticated: boolean;
  token?: string;
  lastLogin?: string;
}

export interface BulkUploadRow {
  sno?: number;
  productName: string;
  price?: number;
  imageUrl?: string;
  imageFilename?: string;
  enabled?: boolean | string;
  description?: string;
  category?: string;
}

export interface StoreSettings {
  whatsappNumber: string;
}
