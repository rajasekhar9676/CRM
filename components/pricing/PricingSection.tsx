'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, Crown, Zap, Building2 } from 'lucide-react';
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
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // Default: 1 month
  const [paymentMode, setPaymentMode] = useState<'onetime' | 'recurring'>('onetime'); // Default: one-time

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
      // Use one-time payment by default (user-friendly, no automatic charges)
      const endpoint = paymentMode === 'onetime' 
        ? '/api/razorpay/create-onetime-payment'
        : '/api/razorpay/create-subscription';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          durationMonths: paymentMode === 'onetime' ? selectedDuration : undefined,
        }),
      });

      const data = await response.json();
      console.log('[Pricing] Payment response:', data);

      if (response.ok) {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        
        // For one-time payment, use order_id instead of subscription_id
        if (paymentMode === 'onetime' && data.orderId) {
          const orderId = data.orderId;
          const planConfig = SUBSCRIPTION_PLANS[plan];
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
                      durationMonths: selectedDuration,
                    }),
                  });

                  const verifyData = await verifyResponse.json();

                  if (verifyResponse.ok) {
                    toast({
                      title: "🎉 Payment Successful!",
                      description: verifyData.message || `Your ${planConfig.name} plan is active for ${selectedDuration} month(s)!`,
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

          // For recurring subscription (original flow)
          if (data.subscriptionId) {
            const subscriptionId = data.subscriptionId;
        
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
              description: `Subscribe to ${data.planDetails?.name || plan} plan`,
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
                console.log('[Pricing] ✅ Payment successful:', response);
                
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
                    console.log('[Pricing] Subscription verified and updated:', verifyData);
                    toast({
                      title: "🎉 Subscription Activated!",
                      description: "Your subscription has been successfully activated! Redirecting to dashboard...",
                    });
                    // Refresh page to show updated subscription status
                    setTimeout(() => {
                      window.location.href = '/dashboard';
                    }, 1500);
                  } else {
                    console.warn('[Pricing] Could not verify subscription, but payment succeeded:', verifyData);
                    toast({
                      title: "Payment Successful",
                      description: verifyData.error || "Your payment was successful. Subscription will be activated shortly.",
                    });
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }
                } catch (verifyError) {
                  console.error('[Pricing] Error verifying subscription:', verifyError);
                  toast({
                    title: "Payment Successful",
                    description: "Your payment was successful. Subscription will be activated shortly. If you don't see the update, please refresh the page.",
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              },
              modal: {
                ondismiss: function() {
                  console.log('[Pricing] User closed the checkout');
                  setLoading(null);
                  toast({
                    title: "Checkout Cancelled",
                    description: "You can complete the subscription later.",
                  });
                },
              },
              // Add error handler for payment failures
              handlerError: function(error: any) {
                console.error('[Pricing] ❌ Payment failed:', error);
                setLoading(null);
                
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

            console.log('[Pricing] Opening Razorpay Checkout with subscription_id:', data.subscriptionId);
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
    <section id="pricing" className="py-12 sm:py-24 bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center mb-12 sm:mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              Choose Your Plan
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                pricing for everyone
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
            const planType = planKey as SubscriptionPlan;
            const isPopular = planType === 'starter';
            const isBusiness = planType === 'business';

            return (
              <Card
                key={planKey}
                className={`relative transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${getPlanColor(planType)} ${
                  isPopular ? 'ring-2 ring-green-500 sm:scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6 px-4 sm:px-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      isPopular ? 'bg-green-100 text-green-600' : 
                      isBusiness ? 'bg-purple-100 text-purple-600' : 
                      planType === 'pro' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getPlanIcon(planType)}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center flex-wrap gap-1">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm sm:text-base lg:text-lg text-gray-500">/month</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 px-4 sm:px-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6">
                    <Button
                      onClick={() => handleSubscribe(planType)}
                      disabled={loading === planType}
                      variant={getButtonVariant(planType)}
                      className={`w-full h-11 sm:h-12 text-sm sm:text-base font-semibold ${
                        isPopular 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : isBusiness
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : planType === 'pro'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : ''
                      }`}
                    >
                      {loading === planType ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : planType === 'free' ? (
                        'Current Plan'
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </Button>
                  </div>

                  {planType === 'free' && (
                    <p className="text-center text-sm text-gray-500">
                      No credit card required
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            All plans include 30-day money-back guarantee
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              No setup fees
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Secure payments
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


