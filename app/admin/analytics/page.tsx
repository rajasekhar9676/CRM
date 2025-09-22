'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin-auth';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalyticsData {
  usersPerPlan: Array<{ plan: string; count: number; color: string }>;
  invoicesPerMonth: Array<{ month: string; count: number; revenue: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; color: string }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      checkAdminAccess();
    }
  }, [status, session, router]);

  const checkAdminAccess = async () => {
    try {
      const adminStatus = await isAdmin((session?.user as any)?.id);
      if (!adminStatus) {
        router.push('/dashboard');
        return;
      }
      setIsAdminUser(true);
      fetchAnalytics();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch users per plan
      const { data: usersData } = await supabase
        .from('admin_users')
        .select('subscription_plan');

      const usersPerPlan = [
        { plan: 'Free', count: 0, color: '#6B7280' },
        { plan: 'Pro', count: 0, color: '#8B5CF6' },
        { plan: 'Business', count: 0, color: '#10B981' },
      ];

      usersData?.forEach(user => {
        const plan = user.subscription_plan || 'free';
        const index = usersPerPlan.findIndex(p => p.plan.toLowerCase() === plan);
        if (index !== -1) {
          usersPerPlan[index].count++;
        }
      });

      // Fetch invoices per month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('amount, created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthlyData: { [key: string]: { count: number; revenue: number } } = {};
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = { count: 0, revenue: 0 };
      }

      invoicesData?.forEach(invoice => {
        const date = new Date(invoice.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].count++;
          monthlyData[monthKey].revenue += invoice.amount;
        }
      });

      const invoicesPerMonth = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.count,
        revenue: data.revenue,
      }));

      // Fetch user growth (last 6 months)
      const { data: allUsersData } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      const userGrowthData: { [key: string]: number } = {};
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        userGrowthData[monthKey] = 0;
      }

      allUsersData?.forEach(user => {
        const date = new Date(user.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (userGrowthData[monthKey] !== undefined) {
          userGrowthData[monthKey]++;
        }
      });

      const userGrowth = Object.entries(userGrowthData).map(([month, users]) => ({
        month,
        users,
      }));

      // Calculate cumulative user growth
      let cumulativeUsers = 0;
      userGrowth.forEach(item => {
        cumulativeUsers += item.users;
        item.users = cumulativeUsers;
      });

      // Revenue by plan
      const revenueByPlan = [
        { plan: 'Pro', revenue: usersPerPlan[1].count * 499, color: '#8B5CF6' },
        { plan: 'Business', revenue: usersPerPlan[2].count * 999, color: '#10B981' },
      ];

      setAnalyticsData({
        usersPerPlan,
        invoicesPerMonth,
        userGrowth,
        revenueByPlan,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', analyticsData.usersPerPlan.reduce((sum, item) => sum + item.count, 0)],
      ['Free Users', analyticsData.usersPerPlan[0].count],
      ['Pro Users', analyticsData.usersPerPlan[1].count],
      ['Business Users', analyticsData.usersPerPlan[2].count],
      ['Total Revenue (Monthly)', analyticsData.revenueByPlan.reduce((sum, item) => sum + item.revenue, 0)],
      ['Pro Revenue', analyticsData.revenueByPlan[0].revenue],
      ['Business Revenue', analyticsData.revenueByPlan[1].revenue],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Platform insights and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportAnalytics} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.usersPerPlan.reduce((sum, item) => sum + item.count, 0)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pro Subscribers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.usersPerPlan[1].count}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Business Subscribers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.usersPerPlan[2].count}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{analyticsData.revenueByPlan.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users per Plan Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Users by Plan</CardTitle>
                  <CardDescription>
                    Distribution of users across subscription plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.usersPerPlan}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ plan, count, percent }) => `${plan}: ${count} (${(percent * 100).toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analyticsData.usersPerPlan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Invoices per Month Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoices Created (Last 6 Months)</CardTitle>
                  <CardDescription>
                    Monthly invoice creation trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.invoicesPerMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Growth Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth (Cumulative)</CardTitle>
                  <CardDescription>
                    Total users over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue by Plan</CardTitle>
                  <CardDescription>
                    Revenue breakdown by subscription plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.revenueByPlan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plan" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}


