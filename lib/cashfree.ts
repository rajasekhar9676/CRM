import { Cashfree } from 'cashfree-pg-sdk-javascript';

// Initialize Cashfree SDK
export const cashfree = new Cashfree({
  apiVersion: '2023-08-01',
  secretKey: process.env.CASHFREE_SECRET_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
});

// Client-side Cashfree configuration
export const cashfreeConfig = {
  appId: process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
  environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
};

// Plan configurations with maximum and recurring amounts
export const CASHFREE_PLANS = {
  starter: {
    planId: process.env.NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID!,
    price: 249,
    name: 'Starter Plan',
    recurringAmount: 25000, // ₹250 in paise
    maxAmount: 25000, // Maximum amount per billing cycle
    billingPeriod: 'monthly',
    billingInterval: 1, // Every 1 month
  },
  pro: {
    planId: process.env.NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID!,
    price: 499,
    name: 'Pro Plan',
    recurringAmount: 49900, // ₹499 in paise
    maxAmount: 49900, // Maximum amount per billing cycle
    billingPeriod: 'monthly',
    billingInterval: 1, // Every 1 month
  },
  business: {
    planId: process.env.NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID!,
    price: 999,
    name: 'Business Plan',
    recurringAmount: 99900, // ₹999 in paise
    maxAmount: 99900, // Maximum amount per billing cycle
    billingPeriod: 'monthly',
    billingInterval: 1, // Every 1 month
  },
};

// Helper function to create subscription with maximum and recurring amounts
export async function createCashfreeSubscription(
  customerId: string,
  planId: string,
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  },
  planConfig?: {
    recurringAmount: number;
    maxAmount: number;
    billingPeriod: string;
    billingInterval: number;
  }
) {
  try {
    const subscriptionRequest = {
      subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planId: planId,
      customerDetails: customerDetails,
      subscriptionMeta: {
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree/webhook`,
      },
      // Add maximum and recurring amount configuration
      ...(planConfig && {
        recurringAmount: planConfig.recurringAmount,
        maxAmount: planConfig.maxAmount,
        billingPeriod: planConfig.billingPeriod,
        billingInterval: planConfig.billingInterval,
      }),
    };

    const response = await cashfree.PGCreateSubscription(subscriptionRequest);
    return response;
  } catch (error) {
    console.error('Error creating Cashfree subscription:', error);
    throw error;
  }
}

// Helper function to get subscription details
export async function getCashfreeSubscription(subscriptionId: string) {
  try {
    const response = await cashfree.PGFetchSubscription(subscriptionId);
    return response;
  } catch (error) {
    console.error('Error fetching Cashfree subscription:', error);
    throw error;
  }
}

// Helper function to cancel subscription
export async function cancelCashfreeSubscription(subscriptionId: string) {
  try {
    const response = await cashfree.PGCancelSubscription(subscriptionId);
    return response;
  } catch (error) {
    console.error('Error canceling Cashfree subscription:', error);
    throw error;
  }
}
