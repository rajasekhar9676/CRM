'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, ShoppingCart, Users, Package, X, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  name: string;
}

interface UserDataViewProps {
  user: UserData;
  onClose: () => void;
}

export function UserDataView({ user, onClose }: UserDataViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch all data for this user in parallel for better performance
      const [customersRes, ordersRes, invoicesRes, productsRes] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', user.id).limit(50),
        supabase.from('orders').select('*').eq('user_id', user.id).limit(50),
        supabase.from('invoices').select('*').eq('user_id', user.id).limit(50),
        supabase.from('products').select('*').eq('user_id', user.id).limit(50),
      ]);

      setCustomers(customersRes.data || []);
      setOrders(ordersRes.data || []);
      setInvoices(invoicesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = {
    customers: customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    orders: orders.filter(o => (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    invoices: invoices.filter(i => (i.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    products: products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">User Data View</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{user.name} ({user.email})</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchUserData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search across all data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{customers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{invoices.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Data Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customers ({filteredData.customers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredData.customers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No customers found</p>
                    ) : (
                      filteredData.customers.map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{customer.name}</p>
                            <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Orders ({filteredData.orders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredData.orders.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No orders found</p>
                    ) : (
                      filteredData.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">₹{order.total_amount}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invoices ({filteredData.invoices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredData.invoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No invoices found</p>
                    ) : (
                      filteredData.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">Invoice #{invoice.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">₹{invoice.amount}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{invoice.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Products ({filteredData.products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredData.products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                    ) : (
                      filteredData.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">₹{product.price}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{product.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
