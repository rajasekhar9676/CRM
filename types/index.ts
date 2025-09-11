export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  email: string;
  instaHandle: string;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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
