'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Zap, Building2, Plus, Minus } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/subscription';
import { SubscriptionPlan } from '@/types';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface PricingSectionProps {
  showTitle?: boolean;
}

export function PricingSection({ showTitle = true }: PricingSectionProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<Record<SubscriptionPlan, number>>({
    free: 1,
    starter: 1,
    pro: 1,
    business: 1,
  }); // Track duration for each plan
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');

  const updateDuration = (plan: SubscriptionPlan, change: number) => {
    setSelectedDurations(prev => {
      const newDuration = (prev[plan] || 1) + change;
      // Ensure minimum 1 month and maximum 12 months
      const clampedDuration = Math.max(1, Math.min(12, newDuration));
      return {
        ...prev,
        [plan]: clampedDuration,
      };
    });
  };

  const activePlan = useMemo(() => SUBSCRIPTION_PLANS[selectedPlan], [selectedPlan]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan! Upgrade to unlock more features.",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(plan);

    try {
      const selectedDuration = selectedDurations[plan] || 1;

      // Use one-time payment by default (user-friendly, no automatic charges)
      const response = await fetch('/api/razorpay/create-onetime-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          durationMonths: selectedDuration,
        }),
      });

      const data = await response.json();
      console.log('[Pricing] Payment response:', data);

      if (response.ok) {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

        // For one-time payment, use order_id
        if (data.orderId) {
          const orderId = data.orderId;
          const planConfig = SUBSCRIPTION_PLANS[plan];
          const selectedDuration = selectedDurations[plan] || 1;
          const totalAmount = Math.round(planConfig.price * selectedDuration * 100); // Amount in paise

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

            // Open Razorpay Checkout for one-time payment (NO card saving, NO subscription)
            const options = {
              key: razorpayKey,
              amount: totalAmount,
              currency: 'INR',
              name: planConfig.name || 'Subscription',
              description: `One-time payment for ${selectedDuration} month(s) - ${planConfig.name} plan`,
              order_id: orderId,
              prefill: {
                email: session?.user?.email || '',
                name: session?.user?.name || '',
              },
              theme: {
                color: '#10b981',
              },
              // Enable payment methods
              method: {
                netbanking: true,
                card: true,
                upi: true,
                wallet: true,
              },
              // Disable card saving
              remember_customer: false,
              modal: {
                ondismiss: function() {
                  console.log('[Pricing] User closed the checkout');
                  setLoading(null);
                  toast({
                    title: "Payment Cancelled",
                    description: "You can complete the payment later.",
                  });
                },
              },
              handler: async function(response: any) {
                console.log('[Pricing] ✅ One-time payment successful:', response);
                
                // Verify payment
                try {
                  const verifyResponse = await fetch('/api/razorpay/verify-onetime-payment', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      orderId: orderId,
                      paymentId: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                      plan: plan,
                      durationMonths: selectedDurations[plan] || 1,
                    }),
                  });

                  const verifyData = await verifyResponse.json();

                  if (verifyResponse.ok) {
                    toast({
                      title: "🎉 Payment Successful!",
                      description: verifyData.message || `Your ${planConfig.name} plan is active for ${selectedDurations[plan] || 1} month(s)!`,
                    });
                    setTimeout(() => {
                      window.location.href = '/dashboard';
                    }, 1500);
                  } else {
                    toast({
                      title: "Payment Successful",
                      description: verifyData.error || "Your payment was successful. Subscription will be activated shortly.",
                    });
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }
                } catch (verifyError) {
                  console.error('[Pricing] Error verifying payment:', verifyError);
                  toast({
                    title: "Payment Successful",
                    description: "Your payment was successful. Subscription will be activated shortly.",
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              },
              handlerError: function(error: any) {
                console.error('[Pricing] ❌ Payment failed:', error);
                setLoading(null);
                
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

            console.log('[Pricing] Opening Razorpay Checkout for one-time payment:', orderId);
            const razorpayInstance = new Razorpay(options);
            razorpayInstance.open();
            return;
          }
        }

        // Handle error responses
        if (data.setupRequired) {
          toast({
            title: "Setup Required",
            description: "Razorpay payment integration needs to be configured. Please contact support.",
            variant: "destructive",
          });
        } else if (data.databaseError) {
          toast({
            title: "Database Error",
            description: "Please run the database setup script to create the subscriptions table.",
            variant: "destructive",
          });
        } else if (data.razorpayError) {
          toast({
            title: "Payment Error",
            description: data.details || "Failed to create subscription with Razorpay. Please try again.",
            variant: "destructive",
          });
        } else if (data.apiError) {
          toast({
            title: "Connection Error",
            description: "Failed to connect to payment gateway. Please check your internet connection.",
            variant: "destructive",
          });
        } else if (!response.ok) {
          toast({
            title: "Payment Error",
            description: data.error || 'Failed to create subscription with Razorpay. Please try again.',
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || 'Failed to create subscription');
        }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return <Zap className="h-6 w-6" />;
      case 'starter':
        return <Crown className="h-6 w-6" />;
      case 'pro':
        return <Building2 className="h-6 w-6" />;
      case 'business':
        return <Building2 className="h-6 w-6" />;
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return 'border-gray-200 hover:border-gray-300';
      case 'starter':
        return 'border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50';
      case 'pro':
        return 'border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'business':
        return 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50';
    }
  };

  const getButtonVariant = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'free':
        return 'outline';
      case 'starter':
        return 'default';
      case 'pro':
        return 'default';
      case 'business':
        return 'default';
    }
  };

  return (
    <section id="pricing" className="py-12 sm:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade in two simple steps
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Pick your plan, choose duration, pay once.
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              No auto-debits or hidden fees. Renewal is always in your control.
            </p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
              const planType = planKey as SubscriptionPlan;
              const isPopular = planType === 'starter';
              const isSelected = selectedPlan === planType;

              return (
                <Card
                  key={planKey}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlan(planType)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPlan(planType);
                    }
                  }}
                  className={`relative h-full cursor-pointer transition-all duration-200 border-2 ${
                    isSelected ? 'border-emerald-500 shadow-xl scale-[1.01]' : 'border-slate-200 hover:border-emerald-200 hover:shadow-lg'
                  } ${getPlanColor(planType)}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white px-4 py-1 text-xs sm:text-sm font-semibold">
                        Most popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-full ${
                        planType === 'starter'
                          ? 'bg-emerald-100 text-emerald-600'
                          : planType === 'pro'
                          ? 'bg-blue-100 text-blue-600'
                          : planType === 'business'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getPlanIcon(planType)}
                      </div>
                      {isSelected && (
                        <Badge className="bg-emerald-500 text-white font-semibold">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                      <CardDescription className="mt-2 text-slate-600">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                          {formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm sm:text-base text-slate-500">per month</span>
                        )}
                      </div>
                      {plan.price > 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Billed as a single one-time payment. Renew whenever you need.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          Get started for free. Upgrade anytime.
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-slate-700">
                          <Check className="h-5 w-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-6">
            <Card className="border-emerald-100 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {activePlan.name} plan summary
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Confirm how many months you want before you pay. Everything is a secure one-time payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {activePlan.price > 0 ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-700">Select duration</p>
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <button
                          type="button"
                          onClick={() => updateDuration(selectedPlan, -1)}
                          disabled={selectedDurations[selectedPlan] <= 1}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease months"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-900">
                            {selectedDurations[selectedPlan]}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {selectedDurations[selectedPlan] === 1 ? 'month' : 'months'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateDuration(selectedPlan, 1)}
                          disabled={selectedDurations[selectedPlan] >= 12}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-400 bg-white px-3 py-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase months"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 6, 12].map((months) => (
                          <button
                            key={months}
                            type="button"
                            onClick={() =>
                              setSelectedDurations((prev) => ({
                                ...prev,
                                [selectedPlan]: months,
                              }))
                            }
                            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                              selectedDurations[selectedPlan] === months
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            {months} {months === 1 ? 'month' : 'months'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        You can renew anytime after the selected duration ends.
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5">
                      <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wide">
                        One-time total
                      </p>
                      <p className="mt-2 text-3xl font-bold text-emerald-700">
                        {formatPrice(activePlan.price * (selectedDurations[selectedPlan] || 1))}
                      </p>
                      <p className="text-sm text-emerald-800 mt-1">
                        {selectedDurations[selectedPlan]} × {formatPrice(activePlan.price)} per month
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5">
                    <p className="text-base font-semibold text-slate-800">
                      You're already on the Free plan.
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Enjoy the core features at no cost. Choose a paid plan to unlock more customers, invoices, and premium tools.
                    </p>
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">How payment works</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Pay once for the exact months you select.</li>
                    <li>• UPI, cards, netbanking, and wallets are supported.</li>
                    <li>• No UPI AutoPay and no card auto-debits.</li>
                    <li>• Plan activates only after successful payment verification.</li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleSubscribe(selectedPlan)}
                  disabled={loading === selectedPlan || (activePlan.price === 0)}
                  className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading === selectedPlan ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing payment...
                    </>
                  ) : activePlan.price === 0 ? (
                    'Free plan is active'
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Pay {formatPrice(activePlan.price * (selectedDurations[selectedPlan] || 1))} and upgrade
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Secure one-time checkout powered by Razorpay.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Need a quick summary?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>• Starter is best for solo businesses that need customer & invoice limits increased.</p>
                <p>• Pro and Business unlock higher limits, team access, and advanced automation.</p>
                <p>• You can always extend the duration later by paying again for however many months you need.</p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="mt-16 rounded-2xl bg-white border border-slate-200 px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Worry-free subscription experience</h3>
              <p className="text-sm text-slate-600 mt-1">
                You're in control from start to finish. Every upgrade is a single transaction.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Cancel or renew anytime
              </div>
              <div className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                No auto-renewal surprises
              </div>
              <div className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Secure UPI & card payments
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


