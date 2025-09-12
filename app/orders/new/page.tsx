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
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function NewOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    dueDate: '',
    status: 'New',
    notes: '',
  });
  const [items, setItems] = useState<OrderItem[]>([
    { name: '', quantity: 1, price: 0 }
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCustomers();
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

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customers.length === 0) {
      alert('Please create a customer first before creating an order.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Calculate total amount
      const totalAmount = calculateTotal();

      // Save to Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: (session?.user as any)?.id,
          customer_id: formData.customerId,
          due_date: formData.dueDate,
          status: formData.status,
          items: items,
          total_amount: totalAmount,
          notes: formData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving order:', error);
        alert('Error saving order. Please try again.');
        return;
      }

      console.log('Order saved:', data);
      alert('Order saved successfully!');
      
      // Redirect back to orders list
      router.push('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
            <p className="text-muted-foreground">
              Create a new order for a customer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>
                Basic details for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => setFormData({...formData, customerId: value})}
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
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
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
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about this order..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>
                    Add items to this order
                  </CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    Total: ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || customers.length === 0}>
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
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}