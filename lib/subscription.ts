import { PlanFeatures, SubscriptionPlan, PlanLimits } from '@/types';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    description: 'Perfect for getting started',
    features: [
      'Up to 50 customers',
      '20 invoices per month',
      'Basic dashboard',
      'Email support'
    ],
    limits: {
      maxCustomers: 50,
      maxInvoicesPerMonth: 20,
      hasProductManagement: false,
      hasWhatsAppCRM: false,
      hasPrioritySupport: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 249,
    currency: 'INR',
    description: 'Perfect for small businesses',
    features: [
      'Up to 200 customers',
      '100 invoices per month',
      'Basic product management',
      'Email support',
      'Basic analytics'
    ],
    limits: {
      maxCustomers: 200,
      maxInvoicesPerMonth: 100,
      hasProductManagement: true,
      hasWhatsAppCRM: false,
      hasPrioritySupport: false,
    },
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID,
    cashfreePlanId: process.env.NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID,
  },
  pro: {
    name: 'Pro',
    price: 499,
    currency: 'INR',
    description: 'For growing businesses',
    features: [
      'Unlimited customers',
      'Unlimited invoices',
      'Advanced product management',
      'Advanced analytics',
      'Priority email support',
      'WhatsApp integration'
    ],
    limits: {
      maxCustomers: -1, // Unlimited
      maxInvoicesPerMonth: -1, // Unlimited
      hasProductManagement: true,
      hasWhatsAppCRM: true,
      hasPrioritySupport: false,
    },
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID,
    cashfreePlanId: process.env.NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID,
  },
  business: {
    name: 'Business',
    price: 999,
    currency: 'INR',
    description: 'Complete business solution',
    features: [
      'Everything in Pro',
      'Advanced WhatsApp CRM',
      'Priority phone support',
      'Advanced automation',
      'Custom integrations',
      'Dedicated account manager'
    ],
    limits: {
      maxCustomers: -1, // Unlimited
      maxInvoicesPerMonth: -1, // Unlimited
      hasProductManagement: true,
      hasWhatsAppCRM: true,
      hasPrioritySupport: true,
    },
    razorpayPlanId: process.env.NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID,
    cashfreePlanId: process.env.NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID,
  },
};

export function getPlanFeatures(plan: SubscriptionPlan): PlanFeatures {
  return SUBSCRIPTION_PLANS[plan];
}

export function isFeatureAvailable(plan: SubscriptionPlan, feature: keyof PlanLimits): boolean {
  const planFeatures = getPlanFeatures(plan);
  return planFeatures.limits[feature] === true;
}

export function getPlanLimit(plan: SubscriptionPlan, limit: keyof Omit<PlanLimits, 'hasProductManagement' | 'hasWhatsAppCRM' | 'hasPrioritySupport'>): number {
  const planFeatures = getPlanFeatures(plan);
  return planFeatures.limits[limit];
}

export function canUseFeature(plan: SubscriptionPlan, feature: keyof PlanLimits): boolean {
  return isFeatureAvailable(plan, feature);
}

export function formatPrice(price: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(price);
}


