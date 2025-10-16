'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, AlertTriangle, Users, CreditCard } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Welcome to MiniCRM ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your use of our 
                customer relationship management software service ("Service") operated by MiniCRM.
              </p>
              <p className="text-gray-700">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part 
                of these terms, then you may not access the Service.
              </p>
            </CardContent>
          </Card>

          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                By creating an account, accessing, or using MiniCRM, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and our Privacy Policy.
              </p>
              <p className="text-gray-700">
                If you are entering into these Terms on behalf of a company or other legal entity, you represent that 
                you have the authority to bind such entity to these Terms.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                MiniCRM is a cloud-based customer relationship management software that provides tools for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Customer management and contact organization</li>
                <li>Order and invoice creation and tracking</li>
                <li>Product catalog management</li>
                <li>Business analytics and reporting</li>
                <li>WhatsApp integration and communication tools</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                3. User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Creation</h3>
                <p className="text-gray-700">
                  To use our Service, you must create an account by providing accurate, complete, and current information. 
                  You are responsible for maintaining the confidentiality of your account credentials.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Security</h3>
                <p className="text-gray-700">
                  You are responsible for all activities that occur under your account. You must notify us immediately 
                  of any unauthorized use of your account or any other breach of security.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Termination</h3>
                <p className="text-gray-700">
                  We reserve the right to terminate or suspend your account at any time for violation of these Terms 
                  or for any other reason at our sole discretion.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                4. Subscription and Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Subscription Plans</h3>
                <p className="text-gray-700">
                  We offer various subscription plans with different features and limitations. Current plans include 
                  Free, Starter (₹249/month), Pro (₹499/month), and Business (₹999/month).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                <p className="text-gray-700">
                  Subscription fees are billed in advance on a monthly basis. All payments are processed securely 
                  through Razorpay. You authorize us to charge your payment method for all applicable fees.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Price Changes</h3>
                <p className="text-gray-700">
                  We reserve the right to modify our pricing at any time. Price changes will be communicated to 
                  existing subscribers with at least 30 days notice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                5. Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit any harmful, threatening, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service for any unlawful or prohibited purpose</li>
                <li>Share your account credentials with others</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data and Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>6. Data and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Ownership</h3>
                <p className="text-gray-700">
                  You retain ownership of all data you input into the Service. We do not claim ownership of your data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Security</h3>
                <p className="text-gray-700">
                  We implement appropriate security measures to protect your data. However, no method of transmission 
                  over the internet is 100% secure.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-700">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use 
                  of the Service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Availability */}
          <Card>
            <CardHeader>
              <CardTitle>7. Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We strive to maintain high service availability but do not guarantee uninterrupted access. 
                The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>
              <p className="text-gray-700">
                We aim for 99.9% uptime but do not provide service level guarantees for the Free plan.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                8. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                To the maximum extent permitted by law, MiniCRM shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                or business opportunities.
              </p>
              <p className="text-gray-700">
                Our total liability to you for any claims arising from or related to the Service shall not exceed 
                the amount you paid us in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Termination by You</h3>
                <p className="text-gray-700">
                  You may terminate your account at any time by canceling your subscription through your account 
                  settings or by contacting us.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Termination by Us</h3>
                <p className="text-gray-700">
                  We may terminate or suspend your account immediately if you breach these Terms or for any other 
                  reason at our sole discretion.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Effect of Termination</h3>
                <p className="text-gray-700">
                  Upon termination, your right to use the Service will cease immediately. We may delete your 
                  account and data after a reasonable period.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes via email or through the Service. Your continued use of the Service after such changes 
                constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes 
                arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Email:</strong> legal@minicrm.com</p>
                <p><strong>Phone:</strong> +91 12345 67890</p>
                <p><strong>Address:</strong> Business District, Mumbai, Maharashtra 400001, India</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
