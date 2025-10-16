'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                At MiniCRM, we are committed to protecting your privacy and ensuring the security of your personal 
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our customer relationship management software service.
              </p>
              <p className="text-gray-700">
                By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
              <CardDescription>
                Types of information we collect from you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Name and email address (required for account creation)</li>
                  <li>Phone number (optional, for WhatsApp integration)</li>
                  <li>Business information (business name, address, etc.)</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Business Data</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Customer information you input into the system</li>
                  <li>Orders, invoices, and product data</li>
                  <li>Communication logs and notes</li>
                  <li>Analytics and usage data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Technical Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Usage patterns and preferences</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
              <CardDescription>
                Purposes for which we use your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Service Provision</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Provide and maintain our CRM service</li>
                    <li>• Process your subscription payments</li>
                    <li>• Enable customer management features</li>
                    <li>• Generate invoices and reports</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Communication</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Send important service updates</li>
                    <li>• Provide customer support</li>
                    <li>• Send billing notifications</li>
                    <li>• Share product updates</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Improvement</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Analyze usage patterns</li>
                    <li>• Improve our service features</li>
                    <li>• Develop new functionality</li>
                    <li>• Optimize performance</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Detect and prevent fraud</li>
                    <li>• Monitor for security threats</li>
                    <li>• Ensure service integrity</li>
                    <li>• Comply with legal obligations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security
              </CardTitle>
              <CardDescription>
                How we protect your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Security Measures</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication</li>
                  <li>Secure data centers with physical security</li>
                  <li>Regular backups and disaster recovery procedures</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Retention</h3>
                <p className="text-gray-700">
                  We retain your data for as long as your account is active or as needed to provide our services. 
                  When you cancel your account, we may retain certain information for a reasonable period for 
                  legal and business purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Information Sharing
              </CardTitle>
              <CardDescription>
                When and with whom we share your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">We Do NOT Sell Your Data</h3>
                <p className="text-gray-700">
                  We do not sell, trade, or rent your personal information to third parties for marketing purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limited Sharing</h3>
                <p className="text-gray-700 mb-3">We may share your information only in these limited circumstances:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>With service providers who assist us in operating our platform (e.g., Razorpay for payments)</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In case of a business transfer or merger</li>
                  <li>With your explicit consent</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
              <CardDescription>
                What you can do with your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Access and Update</h3>
                  <p className="text-sm text-gray-600">View and update your personal information in your account settings</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Data Export</h3>
                  <p className="text-sm text-gray-600">Request a copy of your data in a portable format</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Deletion</h3>
                  <p className="text-sm text-gray-600">Request deletion of your account and associated data</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Communication Preferences</h3>
                  <p className="text-sm text-gray-600">Opt out of marketing communications while keeping service updates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
              <CardDescription>
                How we use cookies and similar technologies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-700">
                  We use essential cookies to provide basic functionality, maintain your login session, 
                  and ensure the security of our service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                <p className="text-gray-700">
                  We use analytics cookies to understand how you use our service and improve its functionality. 
                  This data is anonymized and aggregated.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cookie Management</h3>
                <p className="text-gray-700">
                  You can control cookies through your browser settings. However, disabling essential cookies 
                  may affect the functionality of our service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
              <CardDescription>
                External services we integrate with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-gray-700">
                  We use Razorpay for payment processing. Razorpay has its own privacy policy and security measures. 
                  We do not store your payment card information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Integration</h3>
                <p className="text-gray-700">
                  When you use WhatsApp features, data is shared with WhatsApp according to their privacy policy. 
                  We only share the minimum necessary information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cloud Infrastructure</h3>
                <p className="text-gray-700">
                  We use secure cloud infrastructure providers to host our service. These providers are bound by 
                  strict data protection agreements.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe your 
                child has provided us with personal information, please contact us.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure that such transfers comply with applicable data protection laws and that appropriate 
                safeguards are in place to protect your information.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Questions about this Privacy Policy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Email:</strong> privacy@minicrm.com</p>
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
