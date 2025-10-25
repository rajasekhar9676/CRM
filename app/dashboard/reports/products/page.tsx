'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Tag, 
  BarChart3,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductStats } from '@/types';

export default function ProductReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    archivedProducts: 0,
    totalValue: 0,
    averagePrice: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user) {
      fetchProductStats();
    }
  }, [session, status, router]);

  const fetchProductStats = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('status, price')
        .eq('user_id', (session?.user as any)?.id);

      if (error) {
        console.error('Error fetching product stats:', error);
        return;
      }

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.status === 'active').length || 0;
      const inactiveProducts = products?.filter(p => p.status === 'inactive').length || 0;
      const archivedProducts = products?.filter(p => p.status === 'archived').length || 0;
      const totalValue = products?.reduce((sum, p) => sum + p.price, 0) || 0;
      const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

      setStats({
        totalProducts,
        activeProducts,
        inactiveProducts,
        archivedProducts,
        totalValue,
        averagePrice,
      });
    } catch (error) {
      console.error('Error fetching product stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Product Reports</h1>
          <p className="text-gray-600 mt-2">
            Insights and analytics for your product catalog
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Total Products</p>
                      <p className="text-3xl font-bold text-emerald-700">{stats.totalProducts}</p>
                    </div>
                    <Package className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Active Products</p>
                      <p className="text-3xl font-bold text-blue-700">{stats.activeProducts}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Value</p>
                      <p className="text-3xl font-bold text-purple-700">
                        ${stats.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Average Price</p>
                      <p className="text-3xl font-bold text-amber-700">
                        ₹{stats.averagePrice.toFixed(2)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Product Status Breakdown
                  </CardTitle>
                  <CardDescription>
                    Distribution of products by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{stats.activeProducts}</p>
                        <p className="text-xs text-gray-500">
                          {stats.totalProducts > 0 
                            ? `${((stats.activeProducts / stats.totalProducts) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">Inactive</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{stats.inactiveProducts}</p>
                        <p className="text-xs text-gray-500">
                          {stats.totalProducts > 0 
                            ? `${((stats.inactiveProducts / stats.totalProducts) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm font-medium">Archived</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{stats.archivedProducts}</p>
                        <p className="text-xs text-gray-500">
                          {stats.totalProducts > 0 
                            ? `${((stats.archivedProducts / stats.totalProducts) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Overview
                  </CardTitle>
                  <CardDescription>
                    Financial summary of your product catalog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Total Inventory Value</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ${stats.totalValue.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Average Product Price</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₹{stats.averagePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Total Products</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {stats.totalProducts}
                      </span>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Active Products</span>
                        <span className="text-sm text-gray-900">
                          {stats.activeProducts} of {stats.totalProducts}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Future Features Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  Additional analytics and reporting features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 mb-1">Top-Selling Products</h3>
                    <p className="text-sm text-gray-500">
                      Track your best-performing products based on order data
                    </p>
                  </div>
                  
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                    <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900 mb-1">Sales Trends</h3>
                    <p className="text-sm text-gray-500">
                      Analyze product performance over time with charts and graphs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
