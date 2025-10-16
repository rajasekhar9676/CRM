'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Clock, Shield, RefreshCw } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Policy</h1>
          <p className="text-xl text-gray-600">
            Information about our digital service delivery and support
          </p>
        </div>

        <div className="space-y-8">
          {/* Digital Service Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-5 w-5" />
                Digital Service Delivery
              </CardTitle>
              <CardDescription className="text-blue-700">
                BizMitra is a cloud-based software service - no physical shipping required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800">
                Since BizMitra is a digital software service, there is no physical shipping involved. 
                Your account and all features are available immediately upon subscription activation.
              </p>
            </CardContent>
          </Card>

          {/* Service Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Service Delivery Timeline
              </CardTitle>
              <CardDescription>
                How quickly you get access to your BizMitra account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-green-600 mb-2">Free Plan</h3>
                  <p className="text-sm text-gray-600">Immediate access upon account creation</p>
                  <p className="text-xs text-gray-500 mt-1">No payment required</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-blue-600 mb-2">Paid Plans</h3>
                  <p className="text-sm text-gray-600">Immediate access upon successful payment</p>
                  <p className="text-xs text-gray-500 mt-1">Usually within 1-2 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Account Setup Process
              </CardTitle>
              <CardDescription>
                What happens after you subscribe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Account Creation</h3>
                    <p className="text-sm text-gray-600">Your BizMitra account is created instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Payment Processing</h3>
                    <p className="text-sm text-gray-600">Payment is processed securely through Razorpay</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Feature Activation</h3>
                    <p className="text-sm text-gray-600">All plan features are activated immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Welcome Email</h3>
                    <p className="text-sm text-gray-600">You receive a welcome email with setup instructions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Support Response Times
              </CardTitle>
              <CardDescription>
                How quickly we respond to your support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-600">Available for all users</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Within 24 hours</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Priority Support</h3>
                    <p className="text-sm text-gray-600">Pro and Business plan subscribers</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Within 4 hours</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone Support</h3>
                    <p className="text-sm text-gray-600">Business plan subscribers only</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Within 2 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Service Availability</CardTitle>
              <CardDescription>
                Our uptime and service reliability commitments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Uptime Guarantee</h3>
                  <p className="text-sm text-gray-600">We maintain 99.9% uptime for our services</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Maintenance Windows</h3>
                  <p className="text-sm text-gray-600">Scheduled maintenance during low-traffic hours</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Data Backup</h3>
                  <p className="text-sm text-gray-600">Daily automated backups of all user data</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
                  <p className="text-sm text-gray-600">Enterprise-grade security and encryption</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                If you have any questions about our service delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> support@minicrm.com
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> +91 12345 67890
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
