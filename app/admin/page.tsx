'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Edit, Save, X, User, Mail, Shield, Crown, RefreshCw, Database, Users, FileText, DollarSign, TrendingUp, Download, Plus, ShoppingCart, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserDataView } from '@/components/admin/UserDataView';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  user_email: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  created_at: string;
  user_email: string;
}

interface EditUserData {
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalProducts: 0,
    totalRevenue: 0,
    invoicesThisMonth: 0
  });
  
  // Search and edit states
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<EditUserData>({ email: '', name: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUserData, setViewingUserData] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/admin-signin?callbackUrl=${encodeURIComponent('/admin')}`);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      checkAdminAndFetchData();
    }
  }, [status, session, router]);

  const checkAdminAndFetchData = async () => {
    try {
      setLoading(true);
      
      // Check if user is admin by email (since admin@minicrm.com is always admin)
      if (session?.user?.email === 'admin@minicrm.com') {
        setIsAdmin(true);
        await fetchAllData();
        return;
      }
      
      // Check if user is admin by role
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', (session?.user as any)?.id)
        .single();

      if (userError || user?.role !== 'admin') {
        setSetupMode(true);
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      setSetupMode(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      console.log('🔍 Fetching contacts via API...');
      
      // Use API route (server-side) which has access to service role key
      const response = await fetch('/api/admin/contacts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Error fetching contacts:', result);
        toast({
          title: "Error Fetching Contacts",
          description: result.error || "Failed to fetch contact submissions.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Contacts fetched:', result.count || 0);
      console.log('✅ Sample data:', result.contacts?.slice(0, 1));
      
      setContacts(result.contacts || []);
    } catch (error: any) {
      console.error('❌ Exception fetching contacts:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch contacts. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchCustomers(),
        fetchOrders(),
        fetchInvoices(),
        fetchProducts(),
        fetchContacts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          users!customers_user_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCustomers = data?.map(customer => ({
        ...customer,
        user_email: customer.users?.email || '',
      })) || [];

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          users!invoices_user_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedInvoices = data?.map(invoice => ({
        ...invoice,
        user_email: invoice.users?.email || '',
        customer_name: invoice.customer_name || 'Unknown Customer',
        invoice_number: `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      })) || [];
      
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_user_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedProducts = data?.map(product => ({
        ...product,
        user_email: product.users?.email || '',
      })) || [];
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const calculateStats = () => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const invoicesThisMonth = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    }).length;

    setStats({
      totalUsers: users.length,
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
      totalProducts: products.length,
      totalRevenue,
      invoicesThisMonth
    });
  };

  useEffect(() => {
    if (users.length > 0 || customers.length > 0 || invoices.length > 0 || products.length > 0) {
      calculateStats();
    }
  }, [users, customers, invoices, products]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditData({
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: editData.email,
          name: editData.name,
          role: editData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, email: editData.email, name: editData.name, role: editData.role }
          : user
      ));

      toast({
        title: "Success",
        description: "User updated successfully.",
      });

      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditData({ email: '', name: '', role: 'user' });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${filename} exported successfully.`,
    });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (setupMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Admin Setup Required
            </CardTitle>
            <CardDescription>
              You need to set up admin credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-yellow-600" />
                <strong className="text-yellow-800">Setup Admin Credentials</strong>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Click the button below to verify and set up admin credentials in your database.
              </p>
              <Button 
                onClick={() => router.push('/admin/verify-setup')}
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Verify & Setup Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need admin access to view this page.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to User Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col h-screen sticky top-0">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <p className="text-xs text-gray-500">BizMitra</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'customers', label: 'Customers', icon: User },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'products', label: 'Products', icon: DollarSign },
            { id: 'contacts', label: 'Contacts', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Refresh Button */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={fetchAllData} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/sync-subscriptions', {
                  method: 'POST',
                });
                const data = await response.json();
                if (response.ok) {
                  toast({
                    title: "Subscriptions Synced",
                    description: `Successfully synced ${data.synced} subscriptions from Razorpay.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`,
                  });
                  fetchAllData(); // Refresh to show updated data
                } else {
                  toast({
                    title: "Sync Failed",
                    description: data.error || "Failed to sync subscriptions.",
                    variant: "destructive",
                  });
                }
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to sync subscriptions.",
                  variant: "destructive",
                });
              }
            }} 
            variant="outline" 
            className="w-full text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Sync Subscriptions
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage your platform</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="ml-auto font-medium text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest invoice activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                          {invoice.invoice_number?.charAt(0) || invoice.id.charAt(0)}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}</p>
                          <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                        </div>
                        <div className="ml-auto font-medium text-sm text-gray-500">
                          ₹{invoice.total_amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Users ({filteredUsers.length})</CardTitle>
                  <CardDescription>View and manage all user accounts</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => exportToCSV(users, 'users')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            <p className="text-gray-600 flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : 'secondary'}
                              className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  User
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setViewingUserData(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Data
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and role
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  value={editData.email}
                                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="user@example.com"
                                />
                              </div>
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={editData.name}
                                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="User Name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="role">Role</Label>
                                <Select
                                  value={editData.role}
                                  onValueChange={(value: 'user' | 'admin') => setEditData(prev => ({ ...prev, role: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">
                                      <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        User
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 mr-2" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveUser} disabled={saving}>
                                  {saving ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-1" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Customers ({filteredCustomers.length})</CardTitle>
                  <CardDescription>View and manage all customer records</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => exportToCSV(customers, 'customers')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{customer.name}</h3>
                            <p className="text-gray-600 flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {customer.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Phone: {customer.phone} | Owner: {customer.user_email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(customer.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Orders ({filteredOrders.length})</CardTitle>
                  <CardDescription>View and manage all order records</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No orders found</p>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                              {order.id.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                              <p className="text-sm text-gray-500">
                                Total: ₹{order.total_amount} | Status: {order.status}
                              </p>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Invoices ({filteredInvoices.length})</CardTitle>
                  <CardDescription>View and manage all invoice records</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => exportToCSV(invoices, 'invoices')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                            {invoice.invoice_number?.charAt(0) || invoice.id.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}</h3>
                            <p className="text-gray-600">{invoice.customer_name}</p>
                            <p className="text-sm text-gray-500">
                              Amount: ₹{invoice.total_amount} | Status: {invoice.status}
                            </p>
                            <p className="text-sm text-gray-500">
                              Owner: {invoice.user_email} | Created: {new Date(invoice.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ₹{invoice.total_amount}
                            </div>
                            <Badge variant="outline">{invoice.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Products ({filteredProducts.length})</CardTitle>
                  <CardDescription>View and manage all product records</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => exportToCSV(products, 'products')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <p className="text-gray-600">Category: {product.category}</p>
                            <p className="text-sm text-gray-500">
                              Price: ₹{product.price} | Owner: {product.user_email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(product.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              ₹{product.price}
                            </div>
                            <Badge variant="outline">{product.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contact Form Submissions ({filteredContacts.length})</CardTitle>
                  <CardDescription>View and manage contact form submissions from website visitors</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredContacts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No contact submissions found</p>
                ) : (
                  filteredContacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{contact.name}</h3>
                              <p className="text-sm text-gray-600">{contact.email}</p>
                              {contact.phone && (
                                <p className="text-sm text-gray-500">{contact.phone}</p>
                              )}
                            </div>
                            <Badge 
                              variant={
                                contact.status === 'new' ? 'default' :
                                contact.status === 'read' ? 'secondary' :
                                contact.status === 'replied' ? 'outline' : 'secondary'
                              }
                            >
                              {contact.status}
                            </Badge>
                          </div>
                          {contact.subject && (
                            <div className="mt-3 mb-2">
                              <p className="font-medium text-gray-900">Subject: {contact.subject}</p>
                            </div>
                          )}
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span>Submitted: {new Date(contact.created_at).toLocaleString()}</span>
                            {contact.updated_at && contact.updated_at !== contact.created_at && (
                              <span>Updated: {new Date(contact.updated_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={contact.status}
                            onValueChange={async (newStatus) => {
                              try {
                                // Use regular supabase client (admin user has access via RLS)
                                const { error } = await supabase
                                  .from('contacts')
                                  .update({ 
                                    status: newStatus,
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', contact.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: "Status Updated",
                                  description: `Contact status updated to ${newStatus}`,
                                });
                                
                                fetchContacts();
                              } catch (error) {
                                console.error('Error updating contact status:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update contact status",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="read">Read</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const mailtoLink = `mailto:${contact.email}?subject=Re: ${contact.subject || 'Your inquiry'}`;
                              window.open(mailtoLink);
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* User Data Viewing Modal */}
      {selectedUser && viewingUserData && (
        <UserDataView 
          user={selectedUser}
          onClose={() => {
            setViewingUserData(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}