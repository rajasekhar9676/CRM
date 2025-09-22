'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Subscription, SubscriptionPlan } from '@/types';
import { getSubscription, getCustomerCount, getInvoiceCountThisMonth } from '@/lib/subscription-utils';
import { getPlanFeatures, getPlanLimit } from '@/lib/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  customerCount: number;
  invoiceCountThisMonth: number;
  canAddCustomer: boolean;
  canCreateInvoice: boolean;
  canUseProductManagement: boolean;
  canUseWhatsAppCRM: boolean;
  hasPrioritySupport: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [invoiceCountThisMonth, setInvoiceCountThisMonth] = useState(0);

  const refreshSubscription = async () => {
    if (!session?.user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const [sub, customerCount, invoiceCount] = await Promise.all([
        getSubscription((session.user as any).id),
        getCustomerCount((session.user as any).id),
        getInvoiceCountThisMonth((session.user as any).id),
      ]);

      setSubscription(sub);
      setCustomerCount(customerCount);
      setInvoiceCountThisMonth(invoiceCount);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setSubscription(null);
      setLoading(false);
      return;
    }

    refreshSubscription();
  }, [session, status]);

  const plan = subscription?.plan || 'free';
  const planFeatures = getPlanFeatures(plan);

  const canAddCustomer = planFeatures.limits.maxCustomers === -1 || customerCount < planFeatures.limits.maxCustomers;
  const canCreateInvoice = planFeatures.limits.maxInvoicesPerMonth === -1 || invoiceCountThisMonth < planFeatures.limits.maxInvoicesPerMonth;
  const canUseProductManagement = planFeatures.limits.hasProductManagement;
  const canUseWhatsAppCRM = planFeatures.limits.hasWhatsAppCRM;
  const hasPrioritySupport = planFeatures.limits.hasPrioritySupport;

  const value: SubscriptionContextType = {
    subscription,
    loading,
    customerCount,
    invoiceCountThisMonth,
    canAddCustomer,
    canCreateInvoice,
    canUseProductManagement,
    canUseWhatsAppCRM,
    hasPrioritySupport,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}


