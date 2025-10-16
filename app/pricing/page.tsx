'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PricingSection } from '@/components/pricing/PricingSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, CheckCircle } from 'lucide-react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                Choose Your Plan
              </h1>
              <p className="text-muted-foreground mt-2">
                Upgrade your BizMitra experience with our flexible pricing plans
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Your Current Plan
            </CardTitle>
            <CardDescription>
              You're currently on the Free plan. Upgrade to unlock more features and grow your business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-white rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Free Plan Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Up to 50 customers</li>
                  <li>• 20 invoices per month</li>
                  <li>• Basic dashboard</li>
                  <li>• Email support</li>
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
              <div className="p-4 bg-white rounded-lg border">
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

        {/* Pricing Plans */}
        <PricingSection showTitle={false} />

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Everything you need to know about our pricing and plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
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
            <CardTitle>Need Help Choosing?</CardTitle>
            <CardDescription>
              Our team is here to help you find the perfect plan for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => router.push('/settings')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Contact Support
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
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
