'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Phone, Mail, Instagram, Edit, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CustomerEditModal } from '@/components/customers/CustomerEditModal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  insta_handle?: string;
  notes?: string;
  tags: string[];
  created_at: string;
}

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user?.id) {
      fetchCustomers();
    }
  }, [status, router, session]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('Error deleting customer:', error);
        return;
      }

      // Refresh the list
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const generateWhatsAppLink = (phone: string, name: string) => {
    const message = `Hello ${name}! I hope you're doing well. I wanted to reach out regarding your recent order.`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleEditSuccess = () => {
    fetchCustomers(); // Refresh the customers list
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
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer relationships ({customers.length} customers)
            </p>
          </div>
          <Button onClick={() => router.push('/customers/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {customers.length === 0 ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first customer to get started.
                  </p>
                  <Button onClick={() => router.push('/customers/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Customer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription>
                        Added {new Date(customer.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateWhatsAppLink(customer.phone!, customer.name)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {customer.insta_handle && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`https://instagram.com/${customer.insta_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {customer.insta_handle}
                      </a>
                    </div>
                  )}
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {customer.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {customer.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Customer Edit Modal */}
        <CustomerEditModal
          customer={selectedCustomer}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      </div>
    </DashboardLayout>
  );
}