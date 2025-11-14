export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
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
  show_in_catalog?: boolean;
  catalog_price?: number | null;
  catalog_badge?: string | null;
  catalog_description?: string | null;
  catalog_button_label?: string | null;
  catalog_featured?: boolean;
  catalog_sort_order?: number;
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

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'business';

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'created' | 'pending';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextDueDate?: string;
  amountPaid?: number;
  billingDurationMonths?: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  cashfreeSubscriptionId?: string;
  cashfreeCustomerId?: string;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSettings {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  headline?: string | null;
  subheading?: string | null;
  accent_color?: string | null;
  hero_image_url?: string | null;
  logo_url?: string | null;
  whatsapp_number?: string | null;
  contact_email?: string | null;
  cta_text?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogOrder {
  id: string;
  user_id: string;
  catalog_slug: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  amount: number;
  currency: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  note?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicCatalogPayload {
  settings: CatalogSettings;
  products: Product[];
}

export interface PlanLimits {
  maxCustomers: number;
  maxInvoicesPerMonth: number;
  hasProductManagement: boolean;
  hasWhatsAppCRM: boolean;
  hasPrioritySupport: boolean;
}

export interface PlanFeatures {
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  limits: PlanLimits;
  stripePriceId?: string;
  cashfreePlanId?: string;
  razorpayPlanId?: string;
}

