'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PricingSection } from '@/components/pricing/PricingSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, CheckCircle, Loader2 } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionProvider';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    
    // Refresh subscription when page loads
    if (status === 'authenticated' && session) {
      refreshSubscription();
    }
  }, [status, router, session, refreshSubscription]);
  
  // Get current plan details
  const currentPlan = subscription?.plan || 'free';
  const planDetails = SUBSCRIPTION_PLANS[currentPlan];
  const planName = planDetails?.name || 'Free';
  const planPrice = planDetails?.price || 0;
  const isActive = subscription?.status === 'active';
  const hasActivePaidSubscription = currentPlan !== 'free' && isActive;

  if (status === 'loading' || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Button - Mobile First */}
          <div className="flex justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          
          {/* Title and Description */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Upgrade your BizMitra experience with our flexible pricing plans
            </p>
          </div>
        </div>

        {/* Current Plan Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center sm:text-left">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Your Current Plan
            </CardTitle>
            <CardDescription className="text-center sm:text-left">
              {subscriptionLoading ? (
                'Loading your subscription...'
              ) : currentPlan === 'free' ? (
                "You're currently on the Free plan. Upgrade to unlock more features and grow your business."
              ) : (
                `You're currently on the ${planName} plan${planPrice > 0 ? ` (₹${planPrice}/month)` : ''}${isActive ? ' - Active' : ''}. ${currentPlan !== 'business' ? 'Upgrade to unlock more features!' : 'You have access to all features!'}`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshSubscription()}
                disabled={subscriptionLoading}
                className="flex items-center gap-2"
              >
                {subscriptionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Refresh Status
                  </>
                )}
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {planName} Plan Features
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {planDetails?.features?.slice(0, 4).map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Upgrade Benefits</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unlimited customers & invoices</li>
                  <li>• Advanced product management</li>
                  <li>• WhatsApp CRM integration</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg border sm:col-span-2 lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-2">Why Upgrade?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Scale your business</li>
                  <li>• Save time with automation</li>
                  <li>• Get priority support</li>
                  <li>• Access advanced features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show different content based on subscription status */}
        {hasActivePaidSubscription ? (
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center sm:text-left">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Active Subscription
              </CardTitle>
              <CardDescription className="text-center sm:text-left">
                You're currently subscribed to the {planName} plan. Manage your subscription or upgrade to unlock more features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{planName} Plan</h3>
                    <Badge variant="default" className="bg-emerald-600">
                      Active
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {planPrice > 0 ? `₹${planPrice}/month` : 'Free'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Next billing: {subscription?.nextDueDate ? new Date(subscription.nextDueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => router.push('/settings')}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    Manage Subscription
                  </Button>
                  {currentPlan !== 'business' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Scroll to pricing section if user wants to upgrade
                        document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto"
                    >
                      View Upgrade Options
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        
        {/* Always show pricing plans below - subscribed users can see upgrade options */}
        <div id="pricing-plans">
          <PricingSection showTitle={hasActivePaidSubscription} />
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center sm:text-left">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-center sm:text-left">
              Everything you need to know about our pricing and plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-sm text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                <p className="text-sm text-gray-600">
                  Yes, all paid plans come with a 30-day money-back guarantee. Try risk-free!
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-gray-600">
                  We accept all major credit cards, debit cards, UPI, net banking, and wallets through Razorpay.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-gray-600">
                  Yes, you can cancel your subscription anytime. No cancellation fees or hidden charges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-center sm:text-left">Need Help Choosing?</CardTitle>
            <CardDescription className="text-center sm:text-left">
              Our team is here to help you find the perfect plan for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push('/settings')}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 order-1 sm:order-1"
              >
                Contact Support
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto order-2 sm:order-2"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
