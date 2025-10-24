'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Eye, MessageCircle, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { InvoiceViewModal } from '@/components/invoices/InvoiceViewModal';
import { InvoiceEditModal } from '@/components/invoices/InvoiceEditModal';
import { SubscriptionLimits } from '@/components/subscription/SubscriptionLimits';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  customer_id: string;
  order_id?: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvoices();
    }
  }, [status]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice. Please try again.');
        return;
      }

      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice. Please try again.');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchInvoices();
    setIsEditModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedInvoice(null);
  };

  const generateWhatsAppLink = async (invoice: Invoice) => {
    try {
      // First generate the PDF
      const pdfBlob = await generatePDFBlob(invoice);
      
      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.id.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show instructions for WhatsApp
      const message = `Hello! Your invoice #${invoice.id.slice(-8)} for $${invoice.amount.toFixed(2)} is ready. I've downloaded the PDF for you. Please attach it to your WhatsApp message and send it to your customer.`;
      
      // Open WhatsApp with instructions
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been downloaded. Please attach it to your WhatsApp message.",
      });
    } catch (error) {
      console.error('Error generating PDF for WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generatePDFBlob = async (invoice: Invoice): Promise<Blob> => {
    // Fetch customer and business details for PDF
    const [customerResult, businessResult] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single(),
      supabase
        .from('users')
        .select('business_name, business_address, business_city, business_state, business_zip, business_phone, business_email, business_website, business_tax_id')
        .eq('id', (session?.user as any)?.id)
        .single()
    ]);

    if (customerResult.error) {
      throw new Error('Error fetching customer');
    }

    if (businessResult.error) {
      throw new Error('Error fetching business profile');
    }

    const customer = customerResult.data;
    const business = businessResult.data;
    const doc = new (await import('jspdf')).jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin - 50, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.id.slice(-8)}`, pageWidth - margin - 50, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - margin - 50, yPosition);

    // Business Info
    yPosition = 20;
    if (business.business_name) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(business.business_name, margin, yPosition);
      yPosition += 8;
    }

    if (business.business_address) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(business.business_address, margin, yPosition);
      yPosition += 5;
    }

    if (business.business_city && business.business_state) {
      doc.text(`${business.business_city}, ${business.business_state} ${business.business_zip || ''}`, margin, yPosition);
      yPosition += 5;
    }

    if (business.business_phone) {
      doc.text(`Phone: ${business.business_phone}`, margin, yPosition);
      yPosition += 5;
    }

    if (business.business_email) {
      doc.text(`Email: ${business.business_email}`, margin, yPosition);
      yPosition += 5;
    }

    // Customer Info
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, margin, yPosition);
    yPosition += 5;

    if (customer.email) {
      doc.text(customer.email, margin, yPosition);
      yPosition += 5;
    }

    if (customer.phone) {
      doc.text(customer.phone, margin, yPosition);
      yPosition += 5;
    }

    // Invoice Details
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Due:', margin, yPosition);
    yPosition += 8;
    doc.setFontSize(16);
    doc.text(`$${invoice.amount.toFixed(2)}`, margin, yPosition);

    // Status
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${invoice.status}`, margin, yPosition);

    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', margin, yPosition);

    // Convert to blob
    return doc.output('blob');
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      // Fetch customer and business details for PDF
      const [customerResult, businessResult] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('id', invoice.customer_id)
          .single(),
        supabase
          .from('users')
          .select('business_name, business_address, business_city, business_state, business_zip, business_phone, business_email, business_website, business_tax_id')
          .eq('id', (session?.user as any)?.id)
          .single()
      ]);

      if (customerResult.error) {
        console.error('Error fetching customer:', customerResult.error);
        alert('Error generating PDF. Please try again.');
        return;
      }

      if (businessResult.error) {
        console.error('Error fetching business profile:', businessResult.error);
        alert('Error generating PDF. Please try again.');
        return;
      }

      const customer = customerResult.data;
      const business = businessResult.data;
      const doc = new (await import('jspdf')).jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - margin - 50, yPosition);
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #${invoice.id.slice(-8)}`, pageWidth - margin - 50, yPosition);
      
      yPosition += 5;
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - margin - 50, yPosition);

      yPosition += 20;

      // Company Info (from business profile)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(business.business_name || 'Your Business Name', margin, yPosition);
      
      yPosition += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (business.business_address) {
        doc.text(business.business_address, margin, yPosition);
        yPosition += 4;
      }
      
      const cityStateZip = [business.business_city, business.business_state, business.business_zip]
        .filter(Boolean)
        .join(', ');
      if (cityStateZip) {
        doc.text(cityStateZip, margin, yPosition);
        yPosition += 4;
      }
      
      if (business.business_phone) {
        doc.text(`Phone: ${business.business_phone}`, margin, yPosition);
        yPosition += 4;
      }
      
      if (business.business_email) {
        doc.text(`Email: ${business.business_email}`, margin, yPosition);
        yPosition += 4;
      }
      
      if (business.business_website) {
        doc.text(`Website: ${business.business_website}`, margin, yPosition);
        yPosition += 4;
      }

      yPosition += 20;

      // Bill To
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', margin, yPosition);
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(customer.name, margin, yPosition);
      yPosition += 4;
      doc.text(customer.email, margin, yPosition);
      if (customer.phone) {
        yPosition += 4;
        doc.text(customer.phone, margin, yPosition);
      }

      yPosition += 20;

      // Invoice Details Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', margin, yPosition);
      doc.text('Amount', pageWidth - margin - 30, yPosition);
      
      yPosition += 8;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Invoice item
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Invoice Amount', margin, yPosition);
      doc.text(`$${invoice.amount.toFixed(2)}`, pageWidth - margin - 30, yPosition);
      
      yPosition += 10;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', pageWidth - margin - 50, yPosition);
      doc.text(`$${invoice.amount.toFixed(2)}`, pageWidth - margin - 30, yPosition);

      yPosition += 20;

      // Status
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${invoice.status}`, margin, yPosition);

      // Tax ID if available
      if (business.business_tax_id) {
        yPosition += 10;
        doc.text(`Tax ID: ${business.business_tax_id}`, margin, yPosition);
      }

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', margin, yPosition);

      // Save the PDF
      doc.save(`invoice-${invoice.id.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
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
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Generate and manage your invoices
            </p>
          </div>
          <Button onClick={() => router.push('/invoices/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>

        {/* Subscription Limits Warning */}
        <SubscriptionLimits type="invoices" />

        {invoices.length === 0 ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by generating your first invoice to get started.
                  </p>
                  <Button onClick={() => router.push('/invoices/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Your First Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg">Invoice #{invoice.id.slice(-8)}</CardTitle>
                      <CardDescription>
                        Created: {new Date(invoice.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-semibold">
                          ${invoice.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Customer: {invoice.customer_id}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoice.order_id && (
                      <div>
                        <h4 className="font-medium mb-1">Related Order:</h4>
                        <p className="text-sm text-muted-foreground">{invoice.order_id}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => handleEdit(invoice)}
                      >
                        <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => generateWhatsAppLink(invoice)}
                      >
                        <MessageCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        WhatsApp
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        onClick={() => generatePDF(invoice)}
                      >
                        <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Invoice View Modal */}
        <InvoiceViewModal
          invoice={selectedInvoice}
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
        />

        {/* Invoice Edit Modal */}
        <InvoiceEditModal
          invoice={selectedInvoice}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      </div>
    </DashboardLayout>
  );
}