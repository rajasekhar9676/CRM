'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getBusinessProfile, formatBusinessAddress } from '@/lib/business-utils';
import jsPDF from 'jspdf';

interface Invoice {
  id: string;
  customer_id: string;
  order_id?: string;
  amount: number;
  status: string;
  created_at: string;
}

import { Customer } from '@/types';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  notes?: string;
  due_date?: string;
}

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

interface BusinessProfile {
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  business_tax_id: string;
  business_logo_url: string;
}

export function InvoiceViewModal({ invoice, isOpen, onClose }: InvoiceViewModalProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoice && isOpen) {
      fetchInvoiceDetails();
    }
  }, [invoice, isOpen]);

  const fetchInvoiceDetails = async () => {
    if (!invoice) return;

    setLoading(true);
    try {
      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.customer_id)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
      } else {
        setCustomer(customerData);
      }

      // Fetch order details if order_id exists
      if (invoice.order_id) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', invoice.order_id)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
        } else {
          setOrder(orderData);
        }
      }

      // Fetch business profile
      const businessProfile = await getBusinessProfile((invoice as any).user_id);
      if (businessProfile) {
        setBusiness(businessProfile);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!invoice || !customer) return;

    const doc = new jsPDF();
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
    doc.text(business?.business_name || 'Your Business Name', margin, yPosition);
    
    yPosition += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (business?.business_address) {
      doc.text(business.business_address, margin, yPosition);
      yPosition += 4;
    }
    
    const cityStateZip = [business?.business_city, business?.business_state, business?.business_zip]
      .filter(Boolean)
      .join(', ');
    if (cityStateZip) {
      doc.text(cityStateZip, margin, yPosition);
      yPosition += 4;
    }
    
    if (business?.business_phone) {
      doc.text(`Phone: ${business.business_phone}`, margin, yPosition);
      yPosition += 4;
    }
    
    if (business?.business_email) {
      doc.text(`Email: ${business.business_email}`, margin, yPosition);
      yPosition += 4;
    }
    
    if (business?.business_website) {
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
    doc.text(customer.email || '', margin, yPosition);
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

    // Order details if available
    if (order) {
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Related Order Details:', margin, yPosition);
      
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order #${order.id.slice(-8)}`, margin, yPosition);
      yPosition += 4;
      doc.text(`Status: ${order.status}`, margin, yPosition);
      yPosition += 4;
      doc.text(`Total: $${order.total_amount.toFixed(2)}`, margin, yPosition);
    }

    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', margin, yPosition);

    // Save the PDF
    doc.save(`invoice-${invoice.id.slice(-8)}.pdf`);
  };

  const generateWhatsAppLink = async () => {
    if (!invoice || !customer) return;

    try {
      // First generate the PDF
      const pdfBlob = await generatePDFBlob();
      
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
      const message = `Hello ${customer.name}! Your invoice #${invoice.id.slice(-8)} for $${invoice.amount.toFixed(2)} is ready. I've downloaded the PDF for you. Please attach it to your WhatsApp message and send it to your customer.`;
      
      // Open WhatsApp with instructions
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Show success message
      alert('PDF downloaded! Please attach it to your WhatsApp message.');
    } catch (error) {
      console.error('Error generating PDF for WhatsApp:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    if (!invoice || !customer || !business) {
      throw new Error('Missing required data');
    }

    const doc = new jsPDF();
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

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Invoice #{invoice.id.slice(-8)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice ID:</span>
                    <span className="font-medium">#{invoice.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-lg font-bold">${invoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Business</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {business ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{business.business_name}</span>
                      </div>
                      {business.business_phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{business.business_phone}</span>
                        </div>
                      )}
                      {business.business_email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{business.business_email}</span>
                        </div>
                      )}
                      {business.business_website && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Website:</span>
                          <a 
                            href={business.business_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit Site
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading business details...</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {customer ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.insta_handle && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Instagram:</span>
                          <a 
                            href={`https://instagram.com/${customer.insta_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            @{customer.insta_handle}
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading customer details...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Related Order */}
            {order && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium">#{order.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                    </div>
                    {order.due_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{new Date(order.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="mt-3">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-sm mt-1">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={generateWhatsAppLink}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Send via WhatsApp
              </Button>
              <Button onClick={generatePDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
