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
      color: 'text-blue-600',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      description: 'Orders in progress',
      color: 'text-yellow-600',
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: ShoppingCart,
      description: 'Orders completed',
      color: 'text-green-600',
    },
    {
      title: 'Unpaid Invoices',
      value: stats.unpaidInvoices,
      icon: FileText,
      description: 'Awaiting payment',
      color: 'text-red-600',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: 'From paid invoices',
      color: 'text-emerald-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {session?.user?.name || 'User'}!
            </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your business today.
              </p>
            </div>
            {isDemoMode && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Demo Mode
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => router.push('/customers/new')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Users className="h-8 w-8 mb-2 text-blue-600" />
              <span className="font-medium">Add Customer</span>
            </button>
            <button
              onClick={() => router.push('/orders/new')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <ShoppingCart className="h-8 w-8 mb-2 text-green-600" />
              <span className="font-medium">Create Order</span>
            </button>
            <button
              onClick={() => router.push('/invoices/new')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <FileText className="h-8 w-8 mb-2 text-purple-600" />
              <span className="font-medium">Generate Invoice</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <TrendingUp className="h-8 w-8 mb-2 text-orange-600" />
              <span className="font-medium">View Analytics</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
 