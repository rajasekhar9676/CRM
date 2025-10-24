'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, Edit, Trash2, Eye, Upload, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderEditModal } from '@/components/orders/OrderEditModal';
import { ImportModal } from '@/components/ui/ImportModal';
import { exportToExcel } from '@/lib/excel-utils';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  due_date: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  notes?: string;
  created_at: string;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner(name)
        `)
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Transform the data to include customer_name
      const transformedOrders = data?.map(order => ({
        ...order,
        customer_name: order.customers?.name
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', error);
        toast({
          title: "Error",
          description: "Failed to delete order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Refresh orders list
      fetchOrders();
      toast({
        title: "Success",
        description: "Order deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleView = (order: Order) => {
    // For now, just show order details in an alert
    // You can create a proper view modal later
    const orderDetails = `
Order ID: ${order.id.slice(-8)}
Status: ${order.status}
Total: $${order.total_amount.toFixed(2)}
Items: ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
Due Date: ${new Date(order.due_date).toLocaleDateString()}
    `;
    alert(orderDetails);
  };

  const handleEditSuccess = () => {
    fetchOrders();
    setIsEditModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrder(null);
  };

  const handleExportOrders = () => {
    const exportData = orders.map(order => ({
      customer_name: order.customer_name,
      status: order.status,
      due_date: order.due_date,
      total_amount: order.total_amount,
      notes: order.notes || '',
      items: JSON.stringify(order.items),
    }));
    
    exportToExcel(exportData, 'orders_export', 'Orders');
    toast({
      title: "Export successful",
      description: "Orders data exported to Excel file.",
    });
  };

  const handleImportOrders = async (importData: any[]) => {
    try {
      const userId = (session?.user as any)?.id;
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // First, get customer IDs for the customer names
      const customerNames = Array.from(new Set(importData.map(order => order.customer_name)));
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name')
        .in('name', customerNames)
        .eq('user_id', userId);

      if (!customers || customers.length === 0) {
        throw new Error('No customers found. Please import customers first.');
      }

      const customerMap = new Map(customers.map(c => [c.name, c.id]));

      // Process each order individually to handle duplicates
      for (const order of importData) {
        try {
          const customerId = customerMap.get(order.customer_name);
          if (!customerId) {
            errorCount++;
            errors.push(`Customer "${order.customer_name}" not found for order`);
            continue;
          }

          // Check if order with same details already exists (optional - you can remove this if you want to allow duplicates)
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', customerId)
            .eq('total_amount', order.total_amount)
            .eq('due_date', order.due_date)
            .eq('user_id', userId)
            .single();

          if (existingOrder) {
            // Skip duplicate order
            skipCount++;
            continue;
          }

          // Insert new order
          const { error: insertError } = await supabase
            .from('orders')
            .insert({
              customer_id: customerId,
              due_date: order.due_date,
              status: order.status,
              total_amount: order.total_amount,
              notes: order.notes,
              items: order.items,
              user_id: userId,
            });

          if (insertError) {
            errorCount++;
            errors.push(`Failed to import order for "${order.customer_name}": ${insertError.message}`);
          } else {
            successCount++;
          }
        } catch (orderError) {
          errorCount++;
          errors.push(`Error processing order for "${order.customer_name}": ${orderError}`);
        }
      }

      // Refresh orders list
      await fetchOrders();

      // Show summary
      if (errorCount > 0) {
        throw new Error(`Import completed with issues:\n- ${successCount} orders imported\n- ${skipCount} orders skipped (duplicates)\n- ${errorCount} orders failed\n\nErrors:\n${errors.join('\n')}`);
      } else {
        toast({
          title: "Import successful",
          description: `${successCount} orders imported, ${skipCount} duplicates skipped.`,
        });
      }
    } catch (error) {
      console.error('Error importing orders:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Track and manage your orders ({orders.length} orders)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={handleExportOrders}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => router.push('/orders/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first order to get started.
                  </p>
                  <Button onClick={() => router.push('/orders/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                      <CardDescription>
                        Due: {new Date(order.due_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ${order.total_amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div>
                        <h4 className="font-medium mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(order)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Edit Modal */}
      <OrderEditModal
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportOrders}
        type="orders"
        title="Import Orders"
        description="Upload an Excel file to import order data. Download the template to see the correct format."
      />
    </DashboardLayout>
  );
}