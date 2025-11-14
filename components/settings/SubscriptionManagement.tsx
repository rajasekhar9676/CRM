'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/context/SubscriptionProvider';
import { formatPrice, SUBSCRIPTION_PLANS } from '@/lib/subscription';
import type { SubscriptionPlan } from '@/types';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionManagement() {
  const { data: session } = useSession();
  const { subscription, loading, customerCount, invoiceCountThisMonth, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDateOnly = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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

      if (response.ok && data.subscriptionId) {
        // Use Razorpay Checkout.js directly (Standard Manual Checkout)
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        const subscriptionId = data.subscriptionId; // Store in variable for closure
        
        if (!razorpayKey) {
          toast({
            title: "Configuration Error",
            description: "Razorpay key ID not found. Please check your environment configuration.",
            variant: "destructive",
          });
          return;
        }

        // Check if Razorpay is loaded
        if (typeof window === 'undefined' || !(window as any).Razorpay) {
          toast({
            title: "Razorpay Not Loaded",
            description: "Razorpay checkout script is loading. Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }

        const Razorpay = (window as any).Razorpay;

        // Open Razorpay Checkout with subscription_id
        const options = {
          key: razorpayKey,
          subscription_id: subscriptionId,
          name: data.planDetails?.name || 'Subscription',
          description: `Subscribe to ${data.planDetails?.name || planType} plan`,
          prefill: {
            email: session?.user?.email || '',
            name: session?.user?.name || '',
          },
          theme: {
            color: '#10b981', // Emerald color
          },
          // Enable payment methods explicitly
          method: {
            netbanking: true,
            card: true,
            upi: true,
            wallet: true,
          },
          // Also configure display blocks for better control
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'Available Payment Methods',
                  instruments: [
                    {
                      method: 'upi'
                    },
                    {
                      method: 'netbanking'
                    },
                    {
                      method: 'card'
                    },
                    {
                      method: 'wallet'
                    }
                  ],
                },
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false, // Only show methods we specify
              },
            },
          },
          handler: async function(response: any) {
            console.log('[Settings] ✅ Payment successful:', response);
            
            // Immediately verify and update subscription status
            try {
              const verifyResponse = await fetch('/api/razorpay/verify-subscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscriptionId: subscriptionId, // Use the stored variable
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok) {
                console.log('[Settings] Subscription verified and updated:', verifyData);
                toast({
                  title: "🎉 Subscription Activated!",
                  description: "Your subscription has been successfully activated!",
                });
                await refreshSubscription();
              } else {
                console.warn('[Settings] Could not verify subscription, but payment succeeded:', verifyData);
                toast({
                  title: "Payment Successful",
                  description: "Your payment was successful. Subscription will be activated shortly.",
                });
              }
            } catch (verifyError) {
              console.error('[Settings] Error verifying subscription:', verifyError);
              toast({
                title: "Payment Successful",
                description: "Your payment was successful. Subscription will be activated shortly.",
              });
            }
            
            // Refresh subscription data
            await refreshSubscription();
          },
          modal: {
            ondismiss: function() {
              console.log('[Settings] User closed the checkout');
              setIsLoading(false);
              toast({
                title: "Checkout Cancelled",
                description: "You can complete the subscription later.",
              });
            },
          },
          // Add error handler for payment failures
          handlerError: function(error: any) {
            console.error('[Settings] ❌ Payment failed:', error);
            setIsLoading(false);
            
            // Parse error message
            let errorMessage = "Payment failed. Please try again.";
            
            if (error.error) {
              const errorCode = error.error.code;
              const errorDescription = error.error.description;
              
              if (errorCode === 'BAD_REQUEST_ERROR') {
                if (errorDescription?.includes('card')) {
                  errorMessage = "Card payment failed. Please check your card details or try a different payment method.";
                } else if (errorDescription?.includes('insufficient')) {
                  errorMessage = "Insufficient funds. Please check your account balance or use a different payment method.";
      } else {
                  errorMessage = errorDescription || "Payment request is invalid. Please check your payment details.";
                }
              } else if (errorCode === 'GATEWAY_ERROR') {
                errorMessage = "Payment gateway error. Please try again in a few moments.";
              } else if (errorCode === 'NETWORK_ERROR') {
                errorMessage = "Network error. Please check your internet connection and try again.";
              } else if (errorDescription) {
                errorMessage = errorDescription;
              }
            }
            
            toast({
              title: "Payment Failed",
              description: errorMessage,
              variant: "destructive",
            });
          },
        };

        console.log('[Settings] Opening Razorpay Checkout with subscription_id:', data.subscriptionId);
        const razorpayInstance = new Razorpay(options);
        razorpayInstance.open();
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

  // Fetch payment details when component loads
  useEffect(() => {
    const userPlan = subscription?.plan || 'free';
    if (subscription?.razorpaySubscriptionId && userPlan !== 'free') {
      fetchPaymentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.razorpaySubscriptionId, subscription?.plan]);

  const fetchPaymentDetails = async () => {
    if (!subscription?.razorpaySubscriptionId) return;

    setLoadingPaymentDetails(true);
    try {
      const response = await fetch('/api/razorpay/get-payment-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.razorpaySubscriptionId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentDetails(data.paymentDetails);
        console.log('✅ Payment details fetched:', data.paymentDetails);
      } else {
        console.error('Error fetching payment details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoadingPaymentDetails(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsLoading(true);
    try {
      // First, refresh from database
      await refreshSubscription();
      
      // If we have a Razorpay subscription, sync from Razorpay API
      if (subscription?.razorpaySubscriptionId) {
        const response = await fetch('/api/razorpay/sync-my-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Subscription Synced",
            description: data.message || "Your subscription has been synced successfully!",
          });
          await refreshSubscription();
          await fetchPaymentDetails(); // Also refresh payment details
          // Reload page to ensure all data updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Even if Razorpay sync fails, database refresh still happened
          await refreshSubscription();
          toast({
            title: "Subscription Refreshed",
            description: "Subscription data has been refreshed from database.",
          });
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } else {
        // Just refresh from database
        await refreshSubscription();
        await fetchPaymentDetails();
        toast({
          title: "Subscription Refreshed",
          description: "Subscription data has been refreshed from database.",
        });
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error syncing subscription:', error);
      // Still try to refresh from database
      await refreshSubscription();
      toast({
        title: "Subscription Refreshed",
        description: "Subscription data has been refreshed from database.",
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

  const plan = (subscription?.plan || 'free') as SubscriptionPlan;
  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.cancelAtPeriodEnd;
  const subscriptionDisplayId =
    subscription?.razorpaySubscriptionId ||
    subscription?.stripeSubscriptionId ||
    subscription?.cashfreeSubscriptionId ||
    null;
  const paymentReference =
    subscription?.razorpayPaymentId ||
    (subscription?.razorpaySubscriptionId?.startsWith('onetime_')
      ? subscription.razorpaySubscriptionId.replace('onetime_', '')
      : subscription?.razorpaySubscriptionId) ||
    subscription?.stripeSubscriptionId ||
    subscription?.cashfreeSubscriptionId ||
    null;
  const orderReference = subscription?.razorpayOrderId || null;

  const calculateDuration = () => {
    if (typeof subscription?.billingDurationMonths === 'number' && subscription.billingDurationMonths > 0) {
      return subscription.billingDurationMonths;
    }

    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      const start = new Date(subscription.currentPeriodStart);
      const end = new Date(subscription.currentPeriodEnd);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diffMs = end.getTime() - start.getTime();
        const approxMonths = Math.max(1, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000)));
        return approxMonths;
      }
    }

    return undefined;
  };

  const billingDuration = calculateDuration();
  const totalAmountPaid =
    typeof subscription?.amountPaid === 'number'
      ? subscription.amountPaid
      : billingDuration && plan !== 'free'
        ? SUBSCRIPTION_PLANS[plan]?.price * billingDuration
        : undefined;

  // Debug logging
  console.log('[SubscriptionManagement] Subscription data:', {
    subscription,
    plan,
    isActive,
    subscriptionPlan: subscription?.plan,
    subscriptionStatus: subscription?.status,
    razorpaySubscriptionId: subscription?.razorpaySubscriptionId,
    currentPeriodStart: subscription?.currentPeriodStart,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    nextDueDate: subscription?.nextDueDate,
    hasSubscription: !!subscription,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Your Plan & Upgrade Options
        </CardTitle>
        <CardDescription>
          Manage your subscription and unlock more features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
          <div>
              <h3 className="text-lg font-semibold">
                Current Plan: {plan === 'free' ? 'Free' : plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Business'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {subscription?.plan ? (
                  `You're currently on the ${plan} plan${plan !== 'free' ? ' with advanced features' : ' with basic features'}.`
                ) : (
                  "You're currently on the free plan with basic features."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              {isCanceled && (
                <Badge variant="destructive">Canceled</Badge>
              )}
            </div>
          </div>
          {plan !== 'free' && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {plan === 'starter' ? '₹249/month' : plan === 'pro' ? '₹499/month' : '₹999/month'}
              </p>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Customers</span>
            </div>
            <div className="text-2xl font-bold">{customerCount}</div>
            <div className="text-xs text-gray-500">
              {(() => {
                const planLimits = SUBSCRIPTION_PLANS[plan]?.limits;
                if (planLimits?.maxCustomers === -1) return 'Unlimited';
                if (plan === 'free') return 'of 50 limit';
                return `of ${planLimits?.maxCustomers || '200'} limit`;
              })()}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Invoices this month</span>
            </div>
            <div className="text-2xl font-bold">{invoiceCountThisMonth}</div>
            <div className="text-xs text-gray-500">
              {(() => {
                const planLimits = SUBSCRIPTION_PLANS[plan]?.limits;
                if (planLimits?.maxInvoicesPerMonth === -1) return 'Unlimited';
                if (plan === 'free') return 'of 20 limit';
                return `of ${planLimits?.maxInvoicesPerMonth || '100'} limit`;
              })()}
            </div>
          </div>
        </div>
        
        {plan === 'free' && (
          <div className="flex justify-end">
            <Button onClick={() => handleUpgrade('starter')} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          </div>
        )}

        {/* Plan Features */}
        <div>
          <h4 className="font-medium mb-3">Plan Features</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {(() => {
                  const planLimits = SUBSCRIPTION_PLANS[plan]?.limits;
                  if (planLimits?.maxCustomers === -1) return 'Unlimited customers';
                  if (plan === 'free') return 'Up to 50 customers';
                  return `Up to ${planLimits?.maxCustomers || '200'} customers`;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
{(() => {
                  const planLimits = SUBSCRIPTION_PLANS[plan]?.limits;
                  if (planLimits?.maxInvoicesPerMonth === -1) return 'Unlimited invoices';
                  if (plan === 'free') return '20 invoices/month';
                  return `${planLimits?.maxInvoicesPerMonth || '100'} invoices/month`;
                })()}
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
            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Subscription / Order ID</span>
                <span className="font-mono text-xs text-gray-900">
                  {orderReference || subscriptionDisplayId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Payment Reference</span>
                <span className="font-mono text-xs text-gray-900">
                  {paymentReference || 'N/A'}
                </span>
              </div>
              {subscription.razorpayPaymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Razorpay Payment ID</span>
                  <span className="font-mono text-xs text-gray-900">
                    {subscription.razorpayPaymentId}
                  </span>
                </div>
              )}
              {subscription.razorpayOrderId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Razorpay Order ID</span>
                  <span className="font-mono text-xs text-gray-900">
                    {subscription.razorpayOrderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Current Period</span>
                <span className="text-gray-900">
                  {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                    <>
                      {formatDateTime(subscription.currentPeriodStart)}
                      <span className="mx-1 text-gray-400">—</span>
                      {formatDateTime(subscription.currentPeriodEnd)}
                    </>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Next Billing Date</span>
                <span className="text-gray-900 font-semibold">
                  {subscription.nextDueDate
                    ? formatDateTime(subscription.nextDueDate)
                    : subscription.currentPeriodEnd
                    ? `${formatDateTime(subscription.currentPeriodEnd)} • Renew manually`
                    : 'N/A'}
                </span>
              </div>
              {typeof totalAmountPaid === 'number' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Amount Paid</span>
                  <span className="text-gray-900 font-semibold">
                    {formatPrice(totalAmountPaid)}
                  </span>
                </div>
              )}
              {typeof billingDuration === 'number' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Duration Purchased</span>
                  <span className="text-gray-900 font-semibold">
                    {billingDuration} month{billingDuration !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {(subscription.razorpaySubscriptionId || subscription.stripeSubscriptionId || subscription.cashfreeSubscriptionId) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment Gateway</span>
                  <span className="text-gray-900">
                    {subscription.razorpaySubscriptionId ? 'Razorpay' : 
                     subscription.stripeSubscriptionId ? 'Stripe' : 
                     subscription.cashfreeSubscriptionId ? 'Cashfree' : 'N/A'}
                  </span>
                </div>
              )}
              
              {/* Payment Method Details */}
              {loadingPaymentDetails ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment Method</span>
                  <span className="text-gray-500 text-xs">Loading...</span>
                </div>
              ) : paymentDetails ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Payment Method</span>
                    <span className="text-gray-900 capitalize font-semibold">
                      {paymentDetails.method === 'card' ? 'Card' :
                       paymentDetails.method === 'upi' ? 'UPI' :
                       paymentDetails.method === 'wallet' ? 'Wallet' :
                       paymentDetails.method === 'netbanking' ? 'Net Banking' :
                       paymentDetails.method || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Card Details */}
                  {paymentDetails.method === 'card' && paymentDetails.card && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Card</span>
                        <span className="text-gray-900 font-mono">
                          •••• •••• •••• {paymentDetails.card.last4}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Network</span>
                        <span className="text-gray-900 capitalize">
                          {paymentDetails.card.network || 'N/A'}
                        </span>
                      </div>
                      {paymentDetails.card.type && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Type</span>
                          <span className="text-gray-900 capitalize">
                            {paymentDetails.card.type}
                          </span>
                        </div>
                      )}
                      {paymentDetails.card.issuer && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Issuer</span>
                          <span className="text-gray-900">
                            {paymentDetails.card.issuer}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* UPI Details */}
                  {paymentDetails.method === 'upi' && paymentDetails.upi && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">UPI ID</span>
                        <span className="text-gray-900 font-mono">
                          {paymentDetails.upi.vpa || paymentDetails.vpa || 'N/A'}
                        </span>
                      </div>
                      {paymentDetails.upi.payer_account_type && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Account Type</span>
                          <span className="text-gray-900 capitalize">
                            {paymentDetails.upi.payer_account_type}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Wallet Details */}
                  {paymentDetails.method === 'wallet' && paymentDetails.wallet && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Wallet</span>
                        <span className="text-gray-900 capitalize">
                          {paymentDetails.wallet.wallet || paymentDetails.wallet || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Net Banking Details */}
                  {paymentDetails.method === 'netbanking' && paymentDetails.netbanking && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Bank</span>
                        <span className="text-gray-900">
                          {paymentDetails.netbanking.bank || paymentDetails.bank || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : subscription?.razorpaySubscriptionId ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Payment Method</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Not available</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchPaymentDetails}
                      disabled={loadingPaymentDetails}
                      className="h-6 px-2 text-xs"
                    >
                      {loadingPaymentDetails ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          {/* Sync Subscription Button */}
          {subscription && (subscription.razorpaySubscriptionId || subscription.stripeSubscriptionId) && (
            <Button
              variant="outline"
              onClick={handleSyncSubscription}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Syncing...' : '🔄 Sync Subscription Status'}
            </Button>
          )}
          
          {/* Cancel Subscription Button */}
          {plan !== 'free' && (
            <>
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
            </>
            )}
          </div>
      </CardContent>
    </Card>
  );
}


