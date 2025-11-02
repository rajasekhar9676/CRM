'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/context/SubscriptionProvider';
import { formatPrice } from '@/lib/subscription';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionManagement() {
  const { subscription, loading, customerCount, invoiceCountThisMonth, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planType: 'starter' | 'pro' | 'business' = 'pro') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planType }),
      });

      const data = await response.json();
      console.log('[Settings] Full Razorpay subscription response:', data);
      console.log('[Settings] data.shortUrl value:', data.shortUrl);
      console.log('[Settings] data.shortUrl type:', typeof data.shortUrl);
      console.log('[Settings] data.shortUrl starts with https://rzp.io/?', data.shortUrl?.startsWith('https://rzp.io/'));

      if (response.ok && data.shortUrl) {
        // Validate shortUrl format before redirecting
        const shortUrl = data.shortUrl.trim();
        console.log('[Settings] Trimmed shortUrl:', shortUrl);
        
        if (!shortUrl.startsWith('https://rzp.io/')) {
          console.error('[Settings] ❌ Invalid shortUrl format!');
          console.error('[Settings] Expected: https://rzp.io/rzp/xxxxx');
          console.error('[Settings] Got:', shortUrl);
          console.error('[Settings] Full response data:', JSON.stringify(data, null, 2));
          
          toast({
            title: "Invalid Checkout URL",
            description: `The payment gateway returned an invalid checkout URL: ${shortUrl}. Expected URL starting with 'https://rzp.io/'. Please check Razorpay settings.`,
            variant: "destructive",
          });
          return;
        }
        
        console.log('[Settings] ✅ Valid shortUrl, redirecting to:', shortUrl);
        window.location.href = shortUrl;
        return;
      }

      // Handle missing shortUrl case
      if (response.ok && data.missingShortUrl) {
        toast({
          title: "Hosted Checkout Not Enabled",
          description: data.details || "Razorpay hosted checkout is not enabled. Please contact Razorpay support to activate it.",
          variant: "destructive",
        });
        return;
      }

      throw new Error(data.error || 'Failed to create subscription');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.razorpaySubscriptionId && !subscription?.stripeSubscriptionId) return;

    setIsLoading(true);
    try {
      // Use Razorpay if razorpaySubscriptionId exists, otherwise fall back to Stripe
      const endpoint = subscription?.razorpaySubscriptionId 
        ? '/api/razorpay/cancel-subscription' 
        : '/api/stripe/cancel-subscription';
      
      const subscriptionId = subscription?.razorpaySubscriptionId || subscription?.stripeSubscriptionId;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subscriptionId: subscriptionId,
          cancelAtCycleEnd: true // Cancel at the end of billing period
        }),
      });

      if (response.ok) {
        toast({
          title: "Subscription Canceled",
          description: "Your subscription has been canceled and will end at the current period.",
        });
        await refreshSubscription();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Loading subscription information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription?.plan || 'free';
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.cancelAtPeriodEnd;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold capitalize">{plan} Plan</h3>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              {isCanceled && (
                <Badge variant="destructive">Canceled</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {plan === 'free' ? 'Free forever' : `₹${plan === 'pro' ? '499' : '999'}/month`}
            </p>
          </div>
          {plan === 'free' && (
            <Button onClick={() => handleUpgrade('starter')} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Customers</span>
            </div>
            <div className="text-2xl font-bold">{customerCount}</div>
            <div className="text-xs text-gray-500">
              {plan === 'free' ? 'of 50 limit' : 'Unlimited'}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Invoices This Month</span>
            </div>
            <div className="text-2xl font-bold">{invoiceCountThisMonth}</div>
            <div className="text-xs text-gray-500">
              {plan === 'free' ? 'of 20 limit' : 'Unlimited'}
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div>
          <h4 className="font-medium mb-3">Plan Features</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {plan === 'free' ? 'Up to 50 customers' : 'Unlimited customers'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {plan === 'free' ? '20 invoices/month' : 'Unlimited invoices'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan !== 'free' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${plan === 'free' ? 'text-gray-500' : ''}`}>
                Product Management
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan === 'business' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={`text-sm ${plan !== 'business' ? 'text-gray-500' : ''}`}>
                WhatsApp CRM
              </span>
            </div>
          </div>
        </div>

        {/* Billing Information */}
        {plan !== 'free' && subscription && (
          <div>
            <h4 className="font-medium mb-3">Billing Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Period</span>
                <span>
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing Date</span>
                <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {plan !== 'free' && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={isLoading || isCanceled}
              className="w-full"
            >
              {isLoading ? 'Processing...' : isCanceled ? 'Subscription Canceled' : 'Cancel Subscription'}
            </Button>
            {isCanceled && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your subscription will end on {new Date(subscription?.currentPeriodEnd || '').toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


