export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  insta_handle?: string;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  ownerId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  dueDate: Date;
  status: 'New' | 'In Progress' | 'Completed' | 'Paid';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  ownerId: string;
  customerId: string;
  orderId?: string;
  amount: number;
  status: 'Unpaid' | 'Paid';
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  plan: 'free' | 'paid';
  email: string;
  photoURL?: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  sku?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  sku: string;
  status: 'active' | 'inactive' | 'archived';
  image?: File;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  archivedProducts: number;
  totalValue: number;
  averagePrice: number;
}

