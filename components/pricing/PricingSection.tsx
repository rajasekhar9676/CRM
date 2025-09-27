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
      const response = await fetch('/api/cashfree/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.authLink) {
        // Redirect to Cashfree payment page
        window.location.href = data.authLink;
      } else if (data.setupRequired) {
        toast({
          title: "Setup Required",
          description: "Cashfree payment integration needs to be configured. Please contact support.",
          variant: "destructive",
        });
      } else if (data.databaseError) {
        toast({
          title: "Database Error",
          description: "Please run the database setup script to create the subscriptions table.",
          variant: "destructive",
        });
      } else if (data.cashfreeError) {
        toast({
          title: "Payment Error",
          description: data.details || "Failed to create subscription with Cashfree. Please try again.",
          variant: "destructive",
        });
      } else if (data.apiError) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to payment gateway. Please check your internet connection.",
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
    <section className="py-24 bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <Crown className="w-4 h-4 mr-2" />
              Choose Your Plan
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                pricing for everyone
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
            const planType = planKey as SubscriptionPlan;
            const isPopular = planType === 'starter';
            const isBusiness = planType === 'business';

            return (
              <Card
                key={planKey}
                className={`relative transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${getPlanColor(planType)} ${
                  isPopular ? 'ring-2 ring-green-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
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
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500 ml-2">/month</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
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
                      className={`w-full h-12 text-lg font-semibold ${
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


