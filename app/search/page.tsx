'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users, ShoppingCart, FileText, Package, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any>({
    customers: [],
    orders: [],
    invoices: [],
    products: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery && session?.user) {
      performSearch(searchQuery);
    }
  }, [searchQuery, session]);

  const performSearch = async (query: string) => {
    if (!query.trim() || !session?.user) return;

    setLoading(true);
    try {
      const userId = (session.user as any)?.id;
      
      // Search across all tables
      const [customersRes, ordersRes, invoicesRes, productsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', userId)
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(10),
        supabase
          .from('orders')
          .select('*,customers!inner(name)')
          .eq('user_id', userId)
          .limit(10),
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .limit(10),
        supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(10),
      ]);

      setResults({
        customers: customersRes.data || [],
        orders: ordersRes.data || [],
        invoices: invoicesRes.data || [],
        products: productsRes.data || [],
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const totalResults = results.customers.length + results.orders.length + results.invoices.length + results.products.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Search across all your data
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, orders, invoices, products..."
                className="pl-10 pr-20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Input
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                style={{ display: 'none' }}
              />
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : totalResults === 0 && searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">Try different search terms</p>
            </CardContent>
          </Card>
        ) : searchQuery ? (
          <div className="space-y-6">
            {/* Results Summary */}
            <p className="text-sm text-muted-foreground">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
            </p>

            {/* Customers */}
            {results.customers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customers ({results.customers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.customers.map((item: any) => (
                      <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.email}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders */}
            {results.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Orders ({results.orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.orders.map((item: any) => (
                      <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">Order #{item.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">Total: ₹{item.total_amount}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoices */}
            {results.invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices ({results.invoices.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.invoices.map((item: any) => (
                      <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">Invoice #{item.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">Amount: ₹{item.amount}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {results.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products ({results.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.products.map((item: any) => (
                      <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Price: ₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Start searching</p>
              <p className="text-sm text-muted-foreground text-center">Search across your customers, orders, invoices, and products</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

