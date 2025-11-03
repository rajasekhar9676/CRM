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
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/context/SubscriptionProvider';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

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

        {/* Current Plan & Upgrade Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/60 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Your Plan & Upgrade Options
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Manage your subscription and unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="group p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Current Plan: {subscription?.plan ? SUBSCRIPTION_PLANS[subscription.plan]?.name || subscription.plan : 'Free'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {subscription?.plan && subscription.plan !== 'free' 
                    ? `You're currently on the ${SUBSCRIPTION_PLANS[subscription.plan]?.name || subscription.plan} plan with advanced features.`
                    : "You're currently on the free plan with basic features."}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Customers:</span>
                    <span className="font-bold text-blue-600">
                      {customerCount}
                      {subscription?.plan ? (
                        SUBSCRIPTION_PLANS[subscription.plan]?.limits.maxCustomers === -1 
                          ? ' (Unlimited)' 
                          : `/${SUBSCRIPTION_PLANS[subscription.plan]?.limits.maxCustomers}`
                      ) : '/50'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Invoices this month:</span>
                    <span className="font-bold text-blue-600">
                      {invoiceCountThisMonth}
                      {subscription?.plan ? (
                        SUBSCRIPTION_PLANS[subscription.plan]?.limits.maxInvoicesPerMonth === -1 
                          ? ' (Unlimited)' 
                          : `/${SUBSCRIPTION_PLANS[subscription.plan]?.limits.maxInvoicesPerMonth}`
                      ) : '/20'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="group p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Upgrade Benefits</h3>
                </div>
                <ul className="text-gray-600 space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Unlimited customers & invoices
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Advanced product management
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    WhatsApp CRM integration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    Priority support
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/pricing')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <span>View Plans & Upgrade</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
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
 
 