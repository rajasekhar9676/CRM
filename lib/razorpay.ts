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
export async function createRazorpaySubscription(
  planId: string,
  customerDetails: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  },
  totalCount?: number
) {
  if (!razorpay) {
    throw new Error('Razorpay not configured. Please set up Razorpay environment variables.');
  }
  
  try {
    const subscriptionData: any = {
      plan_id: planId,
      total_count: totalCount || 12, // Default to 12 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
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
          const existingCustomers = await razorpay.customers.all({
            email: customerDetails.customerEmail,
            contact: customerDetails.customerPhone,
            count: 1,
          });

          const existingCustomer = existingCustomers?.items?.[0];

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

    const subscription = await razorpay.subscriptions.create(subscriptionData);
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


