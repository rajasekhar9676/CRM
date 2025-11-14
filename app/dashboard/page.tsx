'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  ShoppingCart,
  FileText,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  CalendarDays,
  CalendarClock,
  CalendarCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/context/SubscriptionProvider';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/subscription';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

interface DashboardStats {
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { subscription, customerCount, invoiceCountThisMonth } = useSubscription();
  const { toast } = useToast();
  const isDemoMode = false; // Demo mode disabled for now
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      try {
        // Store the intended destination before redirecting
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', '/dashboard');
        }
        router.push('/?auth=login');
      } catch (error) {
        console.error('Error in dashboard redirect:', error);
        router.push('/?auth=login');
      }
      return;
    }

    const fetchStats = async () => {
      if (!(session?.user as any)?.id) return;

      try {
        // Fetch customers
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', (session?.user as any)?.id);

        if (customersError) {
          console.error('Error fetching customers:', customersError);
        }
        const totalCustomers = customers?.length || 0;

        // Fetch orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('status')
          .eq('user_id', (session?.user as any)?.id);

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        }
        
        const pendingOrders = orders?.filter(order => 
          order.status === 'New' || order.status === 'In Progress'
        ).length || 0;
        const completedOrders = orders?.filter(order => 
          order.status === 'Completed' || order.status === 'Paid'
        ).length || 0;

        // Fetch invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('status, amount')
          .eq('user_id', (session?.user as any)?.id);

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
        }
        
        const unpaidInvoices = invoices?.filter(invoice => 
          invoice.status === 'Unpaid'
        ).length || 0;
        
        const totalRevenue = invoices
          ?.filter(invoice => invoice.status === 'Paid')
          .reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0;

        setStats({
          totalCustomers,
          pendingOrders,
          completedOrders,
          unpaidInvoices,
          totalRevenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status, router]);

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

  const currentPlanKey = subscription?.plan || 'free';
  const planDetails = SUBSCRIPTION_PLANS[currentPlanKey] || SUBSCRIPTION_PLANS.free;
  const isPaidPlan = currentPlanKey !== 'free';
  const subscriptionStatus = subscription?.status || 'inactive';

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDateOnly = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateBillingDuration = () => {
    if (subscription?.billingDurationMonths && subscription.billingDurationMonths > 0) {
      return subscription.billingDurationMonths;
    }

    if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
      const start = new Date(subscription.currentPeriodStart);
      const end = new Date(subscription.currentPeriodEnd);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diffMs = end.getTime() - start.getTime();
        const approxMonths = Math.max(1, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000)));
        return approxMonths;
      }
    }

    return 1;
  };

  const billingDuration = calculateBillingDuration();

  const totalAmountPaid = isPaidPlan
    ? subscription?.amountPaid ?? planDetails.price * billingDuration
    : 0;

  const paymentReference =
    subscription?.razorpayPaymentId ||
    (subscription?.razorpaySubscriptionId?.startsWith('onetime_')
      ? subscription.razorpaySubscriptionId.replace('onetime_', '')
      : subscription?.razorpaySubscriptionId) ||
    subscription?.stripeSubscriptionId ||
    subscription?.cashfreeSubscriptionId ||
    null;

  const orderReference = subscription?.razorpayOrderId || null;

  const subscriptionDisplayId =
    subscription?.razorpaySubscriptionId ||
    subscription?.stripeSubscriptionId ||
    subscription?.cashfreeSubscriptionId ||
    null;

  const nextBillingText = subscription?.nextDueDate
    ? formatDateTime(subscription.nextDueDate)
    : subscription?.currentPeriodEnd
      ? `${formatDateOnly(subscription.currentPeriodEnd)} • renew manually`
      : '—';

  const invoiceNumber = paymentReference
    ? `BM-${paymentReference.slice(-6).toUpperCase()}`
    : `BM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
        new Date().getDate()
      ).padStart(2, '0')}`;

  const handleDownloadInvoice = () => {
    if (!subscription || !isPaidPlan) {
      toast({
        title: 'No invoice available yet',
        description: 'Upgrade to a paid plan to generate billing invoices.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const issueDate = formatDateOnly(new Date().toISOString());
      const periodText = `${formatDateOnly(subscription.currentPeriodStart)} - ${formatDateOnly(
        subscription.currentPeriodEnd
      )}`;
      const displayAmount = `INR ${totalAmountPaid.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      doc.setFontSize(18);
      doc.text('BizMitra Subscription Invoice', 105, 20, { align: 'center' });

      doc.setFontSize(11);
      doc.text(`Invoice #: ${invoiceNumber}`, 14, 35);
      doc.text(`Invoice Date: ${issueDate}`, 14, 41);
      doc.line(14, 45, 196, 45);

      doc.setFontSize(12);
      doc.text('Billed To:', 14, 58);
      doc.setFontSize(11);
      doc.text(session?.user?.name || 'Customer', 14, 64);
      if (session?.user?.email) {
        doc.text(session.user.email, 14, 70);
      }

      doc.setFontSize(12);
      doc.text('Subscription Details', 14, 86);
      doc.setFontSize(11);
      doc.text(`Plan: ${planDetails.name}`, 14, 92);
      doc.text(`Duration: ${billingDuration} month(s)`, 14, 98);
      doc.text(`Access Period: ${periodText}`, 14, 104);
      doc.text(`Payment ID: ${paymentReference || 'N/A'}`, 14, 110);
      if (orderReference) {
        doc.text(`Order ID: ${orderReference}`, 14, 116);
      }
      doc.text(`Amount Paid: ${displayAmount}`, 14, orderReference ? 122 : 116);

      doc.setFontSize(11);
      doc.text('Issued by: BizMitra Billing Team', 14, 140);
      doc.text('This is a system generated invoice for your records.', 14, 146);
      doc.text('Need help? Reach us at support@bizmitra.in', 14, 152);

      const filename = `BizMitra-Invoice-${paymentReference || invoiceNumber}.pdf`;
      doc.save(filename);

      toast({
        title: 'Invoice downloaded',
        description: 'Check your downloads folder for the PDF invoice.',
      });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast({
        title: 'Invoice download failed',
        description: 'We could not generate the invoice. Please try again shortly.',
        variant: 'destructive',
      });
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      description: 'Active customers',
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100',
      iconColor: 'text-emerald-600',
      cardBg: 'bg-gradient-to-br from-emerald-50/50 to-green-50/50',
      borderColor: 'border-emerald-200/60',
      shadowColor: 'shadow-emerald-100',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'Orders in progress',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      cardBg: 'bg-gradient-to-br from-amber-50/50 to-orange-50/50',
      borderColor: 'border-amber-200/60',
      shadowColor: 'shadow-amber-100',
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: ShoppingCart,
      description: 'Orders completed',
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100',
      iconColor: 'text-green-600',
      cardBg: 'bg-gradient-to-br from-green-50/50 to-emerald-50/50',
      borderColor: 'border-green-200/60',
      shadowColor: 'shadow-green-100',
    },
    {
      title: 'Unpaid Invoices',
      value: stats.unpaidInvoices,
      icon: FileText,
      description: 'Awaiting payment',
      gradient: 'from-red-500 to-rose-600',
      iconBg: 'bg-gradient-to-br from-red-100 to-rose-100',
      iconColor: 'text-red-600',
      cardBg: 'bg-gradient-to-br from-red-50/50 to-rose-50/50',
      borderColor: 'border-red-200/60',
      shadowColor: 'shadow-red-100',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'From paid invoices',
      gradient: 'from-emerald-600 to-teal-700',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
      iconColor: 'text-emerald-700',
      cardBg: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50',
      borderColor: 'border-emerald-200/60',
      shadowColor: 'shadow-emerald-100',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {session?.user?.name || 'User'}! 👋
                  </h1>
                </div>
                <p className="text-emerald-100 text-lg">
                  Here's what's happening with your business today.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">Growing Business</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Active Today</span>
                  </div>
                </div>
              </div>
              {isDemoMode && (
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                  Demo Mode
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statCards.map((stat, index) => (
              <Card 
                key={stat.title} 
                className={`group relative overflow-hidden ${stat.cardBg} ${stat.borderColor} border backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    {stat.description}
                  </p>
                  <div className={`h-1 w-full bg-gradient-to-r ${stat.gradient} rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-300`}></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Billing & Subscription Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/60 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              Billing & Subscription
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              {isPaidPlan
                ? 'Keep track of your billing dates, renewal reminders, and plan limits.'
                : 'Review your current limits and upgrade only when you are ready.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-blue-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={isPaidPlan ? 'outline' : 'secondary'}
                          className={`text-xs font-semibold uppercase tracking-wide ${
                            isPaidPlan
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                              : 'border-blue-200 text-blue-600 bg-blue-50'
                          }`}
                        >
                          {isPaidPlan
                            ? subscriptionStatus === 'active'
                              ? 'Active'
                              : subscriptionStatus
                            : 'Free Plan'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {planDetails.price > 0 ? `${formatPrice(planDetails.price)}/month` : '₹0/month'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{planDetails.name} Plan</h3>
                      <p className="mt-1 text-sm text-gray-600 max-w-lg">
                        {isPaidPlan
                          ? 'One-time payment confirmed. Renew only when you are ready and extend the plan for more months.'
                          : 'Start exploring with the free plan. Upgrade anytime to unlock more capacity and features.'}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CalendarDays className="h-4 w-4" />
                        Plan Started
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900">
                        {formatDateTime(subscription?.currentPeriodStart)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CalendarCheck className="h-4 w-4" />
                        Active Until
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900">
                        {formatDateTime(subscription?.currentPeriodEnd)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CalendarClock className="h-4 w-4" />
                        Next Billing Reminder
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900">
                        {nextBillingText}
                      </dd>
                      <p className="mt-1 text-xs text-blue-600">
                        We only charge again when you choose to extend.
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CreditCard className="h-4 w-4" />
                        Amount Paid
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900">
                        {isPaidPlan ? formatPrice(totalAmountPaid) : '₹0.00'}
                      </dd>
                      <p className="mt-1 text-xs text-blue-600">
                        Calculated from your latest verified payment.
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CreditCard className="h-4 w-4" />
                        Duration Purchased
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900">
                        {billingDuration} month{billingDuration !== 1 ? 's' : ''}
                      </dd>
                      <p className="mt-1 text-xs text-blue-600">
                        Extend anytime from the billing screen.
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                        <CreditCard className="h-4 w-4" />
                        Payment Reference
                      </div>
                      <dd className="mt-2 text-base font-semibold text-gray-900 truncate">
                        {paymentReference || '—'}
                      </dd>
                      <p className="mt-1 text-xs text-blue-600">
                        Quote this ID when you need billing support.
                      </p>
                    </div>
                    {orderReference || subscriptionDisplayId ? (
                      <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-4">
                        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold uppercase tracking-wide">
                          <CreditCard className="h-4 w-4" />
                          {orderReference ? 'Order Reference' : 'Subscription ID'}
                        </div>
                        <dd className="mt-2 text-base font-semibold text-gray-900 truncate">
                          {orderReference || subscriptionDisplayId || '—'}
                        </dd>
                        <p className="mt-1 text-xs text-blue-600">
                          Stored in Supabase for audit history.
                        </p>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="rounded-2xl border border-blue-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Usage this cycle
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                      <span className="text-sm font-medium text-gray-700">Customers</span>
                      <span className="font-bold text-blue-600">
                        {customerCount}
                        {planDetails.limits.maxCustomers === -1
                          ? ' / Unlimited'
                          : ` / ${planDetails.limits.maxCustomers}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                      <span className="text-sm font-medium text-gray-700">Invoices this month</span>
                      <span className="font-bold text-blue-600">
                        {invoiceCountThisMonth}
                        {planDetails.limits.maxInvoicesPerMonth === -1
                          ? ' / Unlimited'
                          : ` / ${planDetails.limits.maxInvoicesPerMonth}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {isPaidPlan ? (
                  <>
                    <div className="rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        Need to extend your plan?
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Add more months whenever you need. You stay in control of renewals.
                      </p>
                      <Button
                        onClick={() => router.push('/pricing')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Add More Months
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        Invoice & payment proof
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Download a stamped PDF invoice that includes your payment ID, duration, and amount paid.
                      </p>
                      <Button
                        onClick={handleDownloadInvoice}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Download Invoice PDF
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-blue-200/60 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        Billing support
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Payment failed? Try UPI, cards, netbanking, or wallets.</li>
                        <li>• UPI AutoPay is not required for one-time payments.</li>
                        <li>• Plan activates only after payment verification.</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        Ready to unlock more?
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Upgrade to increase limits and access advanced automation, CRM, and analytics.
                      </p>
                      <Button
                        onClick={() => router.push('/pricing')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        View Paid Plans
                      </Button>
                    </div>
                    <div className="rounded-2xl border border-blue-200/60 bg-white/70 backdrop-blur-sm p-5 shadow-sm">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        Why teams upgrade
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Serve more than 50 customers without limit worries.</li>
                        <li>• Generate up to 100 invoices per month on Starter.</li>
                        <li>• Access automation, WhatsApp CRM, and priority support on higher plans.</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 border-emerald-200/60 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => router.push('/customers/new')}
              className="group flex flex-col items-center p-6 bg-white/70 backdrop-blur-sm border border-emerald-200/50 rounded-2xl hover:bg-white hover:border-emerald-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-emerald-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="font-bold text-gray-900 mt-4 text-lg">Add Customer</span>
              <span className="text-sm text-gray-500 mt-1">New customer</span>
              <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mt-3 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => router.push('/orders/new')}
              className="group flex flex-col items-center p-6 bg-white/70 backdrop-blur-sm border border-green-200/50 rounded-2xl hover:bg-white hover:border-green-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="font-bold text-gray-900 mt-4 text-lg">Create Order</span>
              <span className="text-sm text-gray-500 mt-1">New order</span>
              <div className="w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-3 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => router.push('/invoices/new')}
              className="group flex flex-col items-center p-6 bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-2xl hover:bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="font-bold text-gray-900 mt-4 text-lg">Generate Invoice</span>
              <span className="text-sm text-gray-500 mt-1">New invoice</span>
              <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mt-3 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className="group flex flex-col items-center p-6 bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl hover:bg-white hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="relative p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="font-bold text-gray-900 mt-4 text-lg">View Analytics</span>
              <span className="text-sm text-gray-500 mt-1">Business insights</span>
              <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-3 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
 
 