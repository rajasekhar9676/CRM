'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get in touch with our team. We're here to help you with any questions or support you need.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Get in Touch
                </CardTitle>
                <CardDescription>
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">support@minicrm.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600">+91 12345 67890</p>
                    <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Office</h3>
                    <p className="text-gray-600">
                      Business District<br />
                      Mumbai, Maharashtra 400001<br />
                      India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Help</CardTitle>
                <CardDescription>
                  Find answers to common questions quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Help Center
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Live Chat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Schedule Demo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">How do I get started with MiniCRM?</h3>
                <p className="text-gray-600">Simply sign up for a free account and start adding your customers. No credit card required for the free plan.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, debit cards, UPI, net banking, and wallets through Razorpay.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time. No cancellation fees or hidden charges.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer customer support?</h3>
                <p className="text-gray-600">Yes, we provide email support for all users and priority support for Pro and Business plan subscribers.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
