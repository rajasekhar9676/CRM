'use client';

import { useSubscription } from '@/context/SubscriptionProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Crown, Users, FileText } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionLimitsProps {
  type: 'customers' | 'invoices';
  onUpgrade?: () => void;
}

export function SubscriptionLimits({ type, onUpgrade }: SubscriptionLimitsProps) {
  const { 
    subscription, 
    customerCount, 
    invoiceCountThisMonth, 
    canAddCustomer, 
    canCreateInvoice 
  } = useSubscription();

  const plan = subscription?.plan || 'free';
  const isFree = plan === 'free';

  if (!isFree) return null;

  const isLimitReached = type === 'customers' ? !canAddCustomer : !canCreateInvoice;
  const currentCount = type === 'customers' ? customerCount : invoiceCountThisMonth;
  const limit = type === 'customers' ? 50 : 20;
  const feature = type === 'customers' ? 'customers' : 'invoices this month';

  if (!isLimitReached) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium text-amber-800">
            {type === 'customers' ? 'Customer Limit Reached' : 'Invoice Limit Reached'}
          </p>
          <p className="text-sm text-amber-700 mt-1">
            You've reached your limit of {limit} {feature}. 
            {type === 'customers' ? ' You currently have' : ' You\'ve created'} {currentCount} {feature}.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button asChild size="sm" variant="outline">
            <Link href="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
          {onUpgrade && (
            <Button size="sm" onClick={onUpgrade}>
              Upgrade Now
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function SubscriptionUsage() {
  const { 
    subscription, 
    customerCount, 
    invoiceCountThisMonth, 
    canAddCustomer, 
    canCreateInvoice 
  } = useSubscription();

  const plan = subscription?.plan || 'free';
  const isFree = plan === 'free';

  if (!isFree) return null;

  const customerUsage = (customerCount / 50) * 100;
  const invoiceUsage = (invoiceCountThisMonth / 20) * 100;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-700">Usage This Month</h4>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Customers
            </span>
            <span className="text-gray-600">{customerCount}/50</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                customerUsage >= 90 ? 'bg-red-500' : 
                customerUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(customerUsage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Invoices
            </span>
            <span className="text-gray-600">{invoiceCountThisMonth}/20</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                invoiceUsage >= 90 ? 'bg-red-500' : 
                invoiceUsage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(invoiceUsage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {(customerUsage >= 70 || invoiceUsage >= 70) && (
        <div className="text-center">
          <Button asChild size="sm" variant="outline">
            <Link href="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}


