'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Download, MessageCircle } from 'lucide-react';

import { Customer } from '@/types';

interface Order {
  id: string;
  customer_id: string;
  due_date: string;
  status: string;
  total_amount: number;
}

export default function NewInvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    amount: '',
    status: 'Unpaid',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCustomers();
      fetchOrders();
    }
  }, [status]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('user_id', (session?.user as any)?.id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      setCustomers(data as Customer[] || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_id, due_date, status, total_amount')
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({
      ...formData,
      customerId: customerId,
      orderId: '', // Reset order selection when customer changes
    });
    
    // Filter orders based on selected customer
    if (customerId) {
      const customerOrders = orders.filter(order => order.customer_id === customerId);
      setFilteredOrders(customerOrders);
    } else {
      setFilteredOrders([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customers.length === 0) {
      alert('Please create a customer first before creating an invoice.');
      return;
    }
    
    setIsLoading(true);

    try {
      const amount = parseFloat(formData.amount) || 0;

      // Save to Supabase
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: (session?.user as any)?.id,
          customer_id: formData.customerId,
          order_id: formData.orderId && formData.orderId !== '' && formData.orderId !== 'none' ? formData.orderId : null,
          amount: amount,
          status: formData.status,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving invoice:', error);
        alert('Error saving invoice. Please try again.');
        return;
      }

      console.log('Invoice saved:', data);
      alert('Invoice saved successfully!');
      
      // Redirect back to invoices list
      router.push('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWhatsAppLink = () => {
    const amount = parseFloat(formData.amount) || 0;
    const message = `Hello! Your invoice for ₹${amount.toFixed(2)} is ready. Please review and let me know if you have any questions.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate New Invoice</h1>
            <p className="text-muted-foreground">
              Create a new invoice for a customer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>
                Basic details for this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={handleCustomerChange}
                    disabled={customers.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={customers.length === 0 ? "No customers available" : "Select a customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No customers found. Create a customer first.
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {customers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => router.push('/customers/new')}
                      >
                        Create your first customer
                      </Button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderId">Related Order</Label>
                  <Select 
                    value={formData.orderId} 
                    onValueChange={(value) => setFormData({...formData, orderId: value})}
                    disabled={!formData.customerId || filteredOrders.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.customerId 
                          ? "Select a customer first" 
                          : filteredOrders.length === 0 
                            ? "No orders for this customer" 
                            : "Select an order (optional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {!formData.customerId ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Please select a customer first
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No orders found for this customer
                        </div>
                      ) : (
                        <>
                          <SelectItem value="none">No related order</SelectItem>
                          {filteredOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              Order #{order.id.slice(-8)} - ₹{order.total_amount.toFixed(2)} ({order.status})
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.customerId && (
                    <p className="text-sm text-muted-foreground">
                      Select a customer to see their orders
                    </p>
                  )}
                  {formData.customerId && filteredOrders.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={() => router.push('/orders/new')}
                      >
                        Create an order for this customer
                      </Button>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Actions</CardTitle>
              <CardDescription>
                Generate and send your invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => console.log('Generate PDF')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Download className="h-6 w-6 mb-2" />
                  <span>Generate PDF</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateWhatsAppLink}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span>Send via WhatsApp</span>
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>PDF generation and WhatsApp integration coming soon!</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || customers.length === 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : customers.length === 0 ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Customer First
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}