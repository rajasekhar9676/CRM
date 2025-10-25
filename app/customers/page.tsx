'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Phone, Mail, Instagram, Edit, Trash2, MessageCircle, Upload, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CustomerEditModal } from '@/components/customers/CustomerEditModal';
import { ImportModal } from '@/components/ui/ImportModal';
import { SubscriptionLimits } from '@/components/subscription/SubscriptionLimits';
import { Customer } from '@/types';
import { exportToExcel } from '@/lib/excel-utils';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleExportCustomers = () => {
    const exportData = customers.map(customer => ({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      insta_handle: customer.insta_handle || '',
      notes: customer.notes || '',
      tags: customer.tags.join(', ') || '',
    }));
    
    exportToExcel(exportData, 'customers_export', 'Customers');
    toast({
      title: "Export successful",
      description: "Customers data exported to Excel file.",
    });
  };

  const handleImportCustomers = async (importData: any[]) => {
    try {
      const userId = (session?.user as any)?.id;
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      console.log('Starting import of', importData.length, 'customers');

      // Process each customer individually to handle duplicates
      for (const customer of importData) {
        try {
          console.log('Processing customer:', customer.name);
          
          // Check if customer with this email or name already exists
          const checkField = customer.email && customer.email.trim() !== '' ? 'email' : 'name';
          const checkValue = customer.email && customer.email.trim() !== '' ? customer.email.trim() : customer.name.trim();
          
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq(checkField, checkValue)
            .eq('user_id', userId)
            .single();

          if (existingCustomer) {
            // Update existing customer
            console.log(`Updating existing customer: ${customer.name}`);
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                name: customer.name,
                email: customer.email || null,
                phone: customer.phone || null,
                insta_handle: customer.insta_handle || null,
                notes: customer.notes || null,
                tags: customer.tags || [],
              })
              .eq('id', existingCustomer.id);

            if (updateError) {
              errorCount++;
              errors.push(`Failed to update customer "${customer.name}": ${updateError.message}`);
              console.error(`Update error for ${customer.name}:`, updateError);
            } else {
              successCount++;
              console.log(`Successfully updated customer: ${customer.name}`);
            }
            continue;
          }

          // Insert new customer
          console.log(`Inserting new customer: ${customer.name}`);
          const { error: insertError } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              email: customer.email || null,
              phone: customer.phone || null,
              insta_handle: customer.insta_handle || null,
              notes: customer.notes || null,
              tags: customer.tags || [],
              user_id: userId,
            });

          if (insertError) {
            errorCount++;
            errors.push(`Failed to import customer "${customer.name}": ${insertError.message}`);
            console.error(`Insert error for ${customer.name}:`, insertError);
          } else {
            successCount++;
            console.log(`Successfully imported customer: ${customer.name}`);
          }
        } catch (customerError) {
          errorCount++;
          const errorMessage = customerError instanceof Error ? customerError.message : String(customerError);
          errors.push(`Error processing customer "${customer.name}": ${errorMessage}`);
          console.error(`Error processing customer "${customer.name}":`, customerError);
        }
      }

      console.log(`Import completed: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);

      // Refresh customers list
      console.log('Refreshing customers list...');
      await fetchCustomers();

      // Show summary
      if (errorCount > 0) {
        throw new Error(`Import completed with issues:\n- ${successCount} customers imported/updated\n- ${skipCount} customers skipped (duplicates)\n- ${errorCount} customers failed\n\nErrors:\n${errors.join('\n')}`);
      } else {
        toast({
          title: "Import successful! 🎉",
          description: `${successCount} customers imported/updated, ${skipCount} duplicates skipped. Your customers are now available in orders and invoices!`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
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
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your customer relationships ({customers.length} customers)
            </p>
          </div>
          
          {/* Mobile-first button layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Primary action - always visible */}
            <Button 
              onClick={() => router.push('/customers/new')} 
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
            
            {/* Secondary actions - responsive layout */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Import</span>
                <span className="sm:hidden">↑</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCustomers}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">↓</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Subscription Limits Warning */}
        <SubscriptionLimits type="customers" />

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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Added {new Date(customer.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1">{customer.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateWhatsAppLink(customer.phone!, customer.name)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                  {customer.insta_handle && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <Instagram className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`https://instagram.com/${customer.insta_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
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
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
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

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportCustomers}
          type="customers"
          title="Import Customers"
          description="Upload an Excel file to import customer data. Download the template to see the correct format."
        />
      </div>
    </DashboardLayout>
  );
}