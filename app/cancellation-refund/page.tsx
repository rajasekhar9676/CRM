'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cancellation and Refund Policy</h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Our Refund Promise
              </CardTitle>
              <CardDescription className="text-green-700">
                We offer a 30-day money-back guarantee for all paid plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-800">
                We're confident you'll love MiniCRM. If you're not completely satisfied within the first 30 days 
                of your subscription, we'll provide a full refund, no questions asked.
              </p>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Subscription Cancellation
              </CardTitle>
              <CardDescription>
                How to cancel your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">How to Cancel</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                    <div>
                      <p className="text-gray-700">Log in to your MiniCRM account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                    <div>
                      <p className="text-gray-700">Go to Settings → Subscription Management</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <div>
                      <p className="text-gray-700">Click "Cancel Subscription"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                    <div>
                      <p className="text-gray-700">Choose immediate cancellation or end of billing period</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Cancellation Options</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Immediate Cancellation</h4>
                    <p className="text-sm text-gray-600">Your subscription ends immediately. You'll lose access to paid features but can continue using the free plan.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">End of Billing Period</h4>
                    <p className="text-sm text-gray-600">Your subscription continues until the end of your current billing period. No further charges will be made.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Refund Policy
              </CardTitle>
              <CardDescription>
                When and how refunds are processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">30-Day Money-Back Guarantee</h3>
                <p className="text-gray-700 mb-4">
                  If you cancel your subscription within 30 days of your initial purchase, you'll receive a full refund 
                  of all payments made, regardless of the reason for cancellation.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The 30-day guarantee applies only to your first subscription. 
                    Subsequent renewals are not eligible for the money-back guarantee.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Refund Processing</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-gray-700">Refunds are processed within 5-7 business days</p>
                      <p className="text-sm text-gray-500">After we receive your cancellation request</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-gray-700">Refunds are issued to your original payment method</p>
                      <p className="text-sm text-gray-500">Credit card, UPI, or bank account used for payment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Partial Refunds</h3>
                <p className="text-gray-700">
                  In some cases, we may offer partial refunds for unused portions of your subscription period. 
                  This is evaluated on a case-by-case basis.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Non-Refundable Items */}
          <Card>
            <CardHeader>
              <CardTitle>Non-Refundable Items</CardTitle>
              <CardDescription>
                Items and services that are not eligible for refunds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Free plan usage (no payment made)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Custom integrations or development work</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Third-party service fees (Razorpay processing fees)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Refunds requested after 30 days from initial purchase</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refund Process */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Process</CardTitle>
              <CardDescription>
                Step-by-step process for requesting a refund
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cancel Your Subscription</h3>
                    <p className="text-sm text-gray-600">Follow the cancellation process outlined above</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Contact Support</h3>
                    <p className="text-sm text-gray-600">Email us at support@minicrm.com with your refund request</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verification</h3>
                    <p className="text-sm text-gray-600">We'll verify your eligibility and process the refund</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Confirmation</h3>
                    <p className="text-sm text-gray-600">You'll receive confirmation once the refund is processed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Circumstances */}
          <Card>
            <CardHeader>
              <CardTitle>Special Circumstances</CardTitle>
              <CardDescription>
                Exceptions and special cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Technical Issues</h3>
                <p className="text-gray-700">
                  If you experience technical issues that prevent you from using the service, we'll work with you 
                  to resolve them. If we cannot resolve the issues, a full refund will be provided.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Billing Errors</h3>
                <p className="text-gray-700">
                  If you're charged incorrectly due to a billing error on our part, we'll provide a full refund 
                  and correct the error immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Service Discontinuation</h3>
                <p className="text-gray-700">
                  If we discontinue the service, all active subscribers will receive a pro-rated refund for 
                  the unused portion of their subscription.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help with Cancellation or Refunds?</CardTitle>
              <CardDescription>
                Our support team is here to help
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-gray-700"><strong>Email:</strong> support@minicrm.com</p>
                    <p className="text-sm text-gray-500">Response within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-gray-700"><strong>Phone:</strong> +91 12345 67890</p>
                    <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM IST</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-gray-700"><strong>Live Chat:</strong> Available in your dashboard</p>
                    <p className="text-sm text-gray-500">Real-time support</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Can I get a refund after 30 days?</h3>
                <p className="text-gray-600">Generally, no. However, we may consider special circumstances on a case-by-case basis.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">How long does it take to process a refund?</h3>
                <p className="text-gray-600">Refunds are typically processed within 5-7 business days after approval.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel and resubscribe later?</h3>
                <p className="text-gray-600">Yes, you can cancel anytime and resubscribe when you're ready. Your data will be preserved for 90 days after cancellation.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What happens to my data after cancellation?</h3>
                <p className="text-gray-600">Your data is preserved for 90 days after cancellation. After that, it may be permanently deleted.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
