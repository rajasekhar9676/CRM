import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance (only if credentials are available)
export const razorpay = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

// Plan configurations with Razorpay plan IDs
export const RAZORPAY_PLANS = {
  starter: {
    planId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID!,
    price: 249,
    name: 'Starter Plan',
    amount: 24900, // ₹249 in paise
    currency: 'INR',
    period: 'monthly',
    interval: 1,
  },
  pro: {
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID!,
    price: 499,
    name: 'Pro Plan',
    amount: 49900, // ₹499 in paise
    currency: 'INR',
    period: 'monthly',
    interval: 1,
  },
  business: {
    planId: process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID!,
    price: 999,
    name: 'Business Plan',
    amount: 99900, // ₹999 in paise
    currency: 'INR',
    period: 'monthly',
    interval: 1,
  },
};

// Helper function to create a Razorpay subscription
// Matches Razorpay API documentation: https://razorpay.com/docs/api/payments/subscriptions/create-subscription/
export async function createRazorpaySubscription(
  planId: string,
  customerDetails: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  },
  options?: {
    totalCount?: number;
    quantity?: number;
    customerNotify?: boolean;
    startAt?: number; // Unix timestamp for when subscription should start
    expireBy?: number; // Unix timestamp for when customer can make authorization payment
    addons?: Array<{
      item: {
        name: string;
        amount: number; // in paise
        currency: string;
      };
    }>;
    offerId?: string;
    notes?: Record<string, string>;
  }
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    // Calculate expire_by: default to 30 days from now (Unix timestamp)
    // This gives customers 30 days to complete the authorization payment
    const defaultExpireBy = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
    
    const subscriptionData: any = {
      // Required parameters
      plan_id: planId,
      total_count: options?.totalCount || 12, // Default to 12 billing cycles
      
      // Optional parameters with defaults
      quantity: options?.quantity || 1,
      customer_notify: options?.customerNotify !== undefined ? options.customerNotify : true, // Boolean, not number
      
      // Set expire_by to ensure customer completes authorization within 30 days
      expire_by: options?.expireBy || defaultExpireBy,
      
      // Optional: start_at for future-dated subscriptions (skip if immediate)
      ...(options?.startAt && { start_at: options.startAt }),
      
      // Optional: addons for upfront charges
      ...(options?.addons && options.addons.length > 0 && { addons: options.addons }),
      
      // Optional: offer_id for discounts
      ...(options?.offerId && { offer_id: options.offerId }),
      
      // Notes with customer details
      notes: {
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        ...options?.notes, // Merge any additional notes
      },
    };

    let customerId = customerDetails.customerId;

    // If customer doesn't exist, create one (or reuse existing)
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name: customerDetails.customerName,
          email: customerDetails.customerEmail,
          contact: customerDetails.customerPhone,
          fail_existing: 0,
        });
        customerId = customer.id;
      } catch (error: any) {
        const description: string | undefined = error?.error?.description || error?.message;
        if (description && description.toLowerCase().includes('customer already exists')) {
          const existingCustomerList = await razorpay.customers.all({
            count: 100,
            skip: 0,
          });

          const existingCustomer = existingCustomerList?.items?.find((item: any) => {
            return (
              item?.email?.toLowerCase() === customerDetails.customerEmail?.toLowerCase() ||
              item?.contact === customerDetails.customerPhone
            );
          });

          if (existingCustomer?.id) {
            customerId = existingCustomer.id;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    if (!customerId) {
      throw new Error('Unable to determine Razorpay customer ID for subscription');
    }

    subscriptionData.customer_id = customerId;

    // Log subscription data being sent to Razorpay (for debugging)
    console.log('📤 Creating Razorpay subscription with data:', {
      plan_id: subscriptionData.plan_id,
      customer_id: subscriptionData.customer_id,
      total_count: subscriptionData.total_count,
      quantity: subscriptionData.quantity,
      customer_notify: subscriptionData.customer_notify,
      expire_by: subscriptionData.expire_by,
      expire_by_formatted: new Date(subscriptionData.expire_by * 1000).toISOString(),
      start_at: subscriptionData.start_at,
      start_at_formatted: subscriptionData.start_at ? new Date(subscriptionData.start_at * 1000).toISOString() : 'Not set (immediate)',
      has_addons: !!subscriptionData.addons,
      offer_id: subscriptionData.offer_id || 'Not set',
      notes: subscriptionData.notes,
    });

    const subscription = await razorpay.subscriptions.create(subscriptionData);
    
    console.log('✅ Razorpay subscription created successfully:', {
      subscription_id: subscription.id,
      status: subscription.status,
      short_url: subscription.short_url,
    });
    
    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
  }
}

// Helper function to get subscription details
export async function getRazorpaySubscription(subscriptionId: string) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching Razorpay subscription:', error);
    throw error;
  }
}

// Helper function to cancel subscription
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = false
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd ? 1 : 0);
    return subscription;
  } catch (error) {
    console.error('Error canceling Razorpay subscription:', error);
    throw error;
  }
}

// Helper function to verify webhook signature
export function verifyRazorpayWebhookSignature(
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');
    
    return expectedSignature === webhookSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Helper function to create a Razorpay order (for one-time payments)
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    const order = await razorpay.orders.create({
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt,
      notes: notes,
    });
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

// Helper function to verify payment signature
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Helper function to create a Razorpay customer
export async function createRazorpayCustomer(
  name: string,
  email: string,
  contact: string
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    const customer = await razorpay.customers.create({
      name: name,
      email: email,
      contact: contact,
      fail_existing: 0,
    });
    return customer;
  } catch (error) {
    console.error('Error creating Razorpay customer:', error);
    throw error;
  }
}


