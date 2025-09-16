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
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
      router.push('/');
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
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'Orders in progress',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: ShoppingCart,
      description: 'Orders completed',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Unpaid Invoices',
      value: stats.unpaidInvoices,
      icon: FileText,
      description: 'Awaiting payment',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'From paid invoices',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-300',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome back, {session?.user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening with your business today.
              </p>
            </div>
            {isDemoMode && (
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                Demo Mode
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.title} className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all duration-200`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-sm text-gray-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
            <CardDescription className="text-gray-600">
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => router.push('/customers/new')}
              className="flex flex-col items-center p-6 border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 hover:shadow-md group"
            >
              <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <span className="font-semibold text-gray-900 mt-3">Add Customer</span>
              <span className="text-sm text-gray-500 mt-1">New customer</span>
            </button>
            <button
              onClick={() => router.push('/orders/new')}
              className="flex flex-col items-center p-6 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:shadow-md group"
            >
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <span className="font-semibold text-gray-900 mt-3">Create Order</span>
              <span className="text-sm text-gray-500 mt-1">New order</span>
            </button>
            <button
              onClick={() => router.push('/invoices/new')}
              className="flex flex-col items-center p-6 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md group"
            >
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900 mt-3">Generate Invoice</span>
              <span className="text-sm text-gray-500 mt-1">New invoice</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex flex-col items-center p-6 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 hover:shadow-md group"
            >
              <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-900 mt-3">View Analytics</span>
              <span className="text-sm text-gray-500 mt-1">Business insights</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
 