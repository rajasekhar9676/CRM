'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthModal from '@/components/auth/AuthModal';
import { PricingSection } from '@/components/pricing/PricingSection';
import { 
  Loader2, 
  Users, 
  ShoppingCart, 
  FileText, 
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Star,
  Zap,
  Shield,
  Smartphone,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (session && status === 'authenticated') {
      try {
        // Check sessionStorage first, then query params, then default to dashboard
        const storedRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('redirectAfterLogin') : null;
        const callbackUrl = searchParams.get('callbackUrl');
        
        // Parse callback URL properly - extract path from full URL if needed
        let redirectTo = storedRedirect || '/dashboard';
        if (callbackUrl) {
          try {
            // If it's a full URL, extract just the path
            const url = new URL(callbackUrl);
            redirectTo = url.pathname + url.search;
          } catch {
            // If it's already a path, use it directly
            redirectTo = callbackUrl;
          }
        }
        
        // Clear the stored redirect
        if (storedRedirect && typeof window !== 'undefined') {
          sessionStorage.removeItem('redirectAfterLogin');
        }
        
        router.push(redirectTo);
      } catch (error) {
        console.error('Error in redirect logic:', error);
        router.push('/dashboard');
      }
    }
  }, [session, status, router, searchParams]);

  // Handle auth modal from URL parameters (when redirected from middleware or NextAuth)
  useEffect(() => {
    try {
      const authParam = searchParams.get('auth');
      const callbackUrl = searchParams.get('callbackUrl');
      
      // If there's a callbackUrl parameter, it means user was redirected for authentication
      if (callbackUrl && !session) {
        // Store the intended destination in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', callbackUrl);
        }
        setAuthMode('login');
        setIsAuthModalOpen(true);
      } else if (authParam === 'login' && !session) {
        // If user came from middleware redirect, check if they were trying to access a protected route
        if (typeof window !== 'undefined') {
          const referrer = document.referrer;
          if (referrer && (referrer.includes('/dashboard') || referrer.includes('/customers') || referrer.includes('/orders') || referrer.includes('/invoices') || referrer.includes('/settings'))) {
            sessionStorage.setItem('redirectAfterLogin', '/dashboard');
          }
        }
        setAuthMode('login');
        setIsAuthModalOpen(true);
      } else if (authParam === 'register' && !session) {
        setAuthMode('register');
        setIsAuthModalOpen(true);
      }
    } catch (error) {
      console.error('Error in auth modal logic:', error);
    }
  }, [searchParams, session]);

  const handleGetStarted = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    }
  };

  const handleLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  const handleDemoMode = () => {
    setIsDemoLoading(true);
    // For demo mode, we'll just redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/images/bizmitra-logo.png" 
                alt="BizMitra Logo" 
                className="h-20 w-auto"
                style={{ 
                  imageRendering: 'crisp-edges',
                  filter: 'contrast(1.1)',
                  WebkitFilter: 'contrast(1.1)'
                }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-emerald-600 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-emerald-50 font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-emerald-50 font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-emerald-50 font-medium">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-600 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-emerald-50 font-medium">Contact</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {session ? (
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleLogin}
                    variant="outline"
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition-all duration-200"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={handleRegister}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Register
                  </Button>
                </>
              )}
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-emerald-100">
              <div className="flex flex-col space-y-2">
                <a href="#home" className="text-gray-700 hover:text-emerald-600 transition-colors px-4 py-3 rounded-lg hover:bg-emerald-50 font-medium">Home</a>
                <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors px-4 py-3 rounded-lg hover:bg-emerald-50 font-medium">Features</a>
                <a href="#pricing" className="text-gray-700 hover:text-emerald-600 transition-colors px-4 py-3 rounded-lg hover:bg-emerald-50 font-medium">Pricing</a>
                <a href="#contact" className="text-gray-700 hover:text-emerald-600 transition-colors px-4 py-3 rounded-lg hover:bg-emerald-50 font-medium">Contact</a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-24 bg-gradient-to-br from-emerald-50 via-white to-green-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 1000+ businesses
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Manage Customers, Orders & Invoices
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                — All in One Place
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Send invoices on WhatsApp, track payments, and grow your business with our simple yet powerful CRM. 
              <span className="text-emerald-600 font-semibold"> Start free today!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-10 py-4 text-xl font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                onClick={scrollToFeatures}
                variant="outline"
                size="lg"
                className="px-10 py-4 text-xl font-semibold border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300"
              >
                See How It Works
              </Button>
            </div>

            {/* Demo preview */}
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden">
                <div className="bg-gray-100 px-6 py-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="ml-4 text-sm text-gray-600">BizMitra Dashboard</div>
                </div>
                <div className="p-8 bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Total Customers</h3>
                        <Users className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-bold text-emerald-600">1,234</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Pending Orders</h3>
                        <ShoppingCart className="h-8 w-8 text-amber-600" />
                      </div>
                      <div className="text-3xl font-bold text-amber-600">56</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Revenue</h3>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-green-600">$45,678</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to 
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                manage your business
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From customer management to invoice generation, we've got all the tools you need to grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-200 bg-gradient-to-br from-white to-emerald-50">
              <CardContent className="p-6 lg:p-8 text-center">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Customer Manager</h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">Save customer contacts in one place with tags, notes, and Instagram handles for better organization.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-200 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="p-6 lg:p-8 text-center">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Order Tracking</h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">Track orders from creation to completion with real-time status updates and due date management.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 hover:border-purple-200 bg-gradient-to-br from-white to-purple-50">
              <CardContent className="p-6 lg:p-8 text-center">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Invoice Generator</h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">Create professional invoices with your business branding and send them via WhatsApp instantly.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-orange-100 hover:border-orange-200 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-6 lg:p-8 text-center">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">WhatsApp CRM</h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">Send invoices, messages, and updates directly through WhatsApp for instant communication.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-emerald-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get started in 
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                just 3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process makes it easy to manage your business from day one.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl lg:text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Add Customer</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed">Start by adding your customer details, contact information, and preferences to build your customer base.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl lg:text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Create Order</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed">Create orders for your customers and track their progress from start to finish with real-time updates.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-2xl lg:text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Send Invoice on WhatsApp</h3>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed">Generate professional invoices and send them directly to customers via WhatsApp for instant delivery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Call-to-Action Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 text-white text-sm font-medium mb-8">
            <Shield className="w-4 h-4 mr-2" />
            Trusted by 1000+ businesses worldwide
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Start Managing Your Business
            <span className="block">in 5 Minutes</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-emerald-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join thousands of businesses already using BizMitra to streamline their operations and grow their revenue.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-6 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Get Started Free
            </Button>
            <Button 
              onClick={handleDemoMode}
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-6 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold transition-all duration-300 w-full sm:w-auto"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                  Try Demo Mode
                </>
              )}
            </Button>
          </div>
          
          <p className="text-emerald-200 text-sm mt-8">
            No credit card required • Free forever • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/images/bizmitra-logo-icon.svg" 
                  alt="BizMitra Logo" 
                  className="h-8 w-8"
                />
              </div>
              <p className="text-gray-400">Simple CRM for managing customers, orders, and invoices.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BizMitra. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}