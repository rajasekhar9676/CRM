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
  pro: {
    name: 'Pro',
    price: 499,
    currency: 'INR',
    description: 'For growing businesses',
    features: [
      'Unlimited customers',
      'Unlimited invoices',
      'Product management',
      'Advanced analytics',
      'Email support',
      'Priority features'
    ],
    limits: {
      maxCustomers: -1, // Unlimited
      maxInvoicesPerMonth: -1, // Unlimited
      hasProductManagement: true,
      hasWhatsAppCRM: false,
      hasPrioritySupport: false,
    },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  business: {
    name: 'Business',
    price: 999,
    currency: 'INR',
    description: 'Complete business solution',
    features: [
      'Everything in Pro',
      'WhatsApp CRM integration',
      'Priority support',
      'Advanced automation',
      'Custom integrations',
      'Phone support'
    ],
    limits: {
      maxCustomers: -1, // Unlimited
      maxInvoicesPerMonth: -1, // Unlimited
      hasProductManagement: true,
      hasWhatsAppCRM: true,
      hasPrioritySupport: true,
    },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
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


