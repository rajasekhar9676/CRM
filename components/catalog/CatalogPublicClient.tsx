'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product, PublicCatalogPayload } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import Image from 'next/image';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CatalogPublicClientProps {
  slug: string;
}

const loadRazorpayScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

    if (document.getElementById('razorpay-checkout-js')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });

export default function CatalogPublicClient({ slug }: CatalogPublicClientProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<PublicCatalogPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    quantity: 1,
    note: '',
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/catalog/${slug}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Catalog not found');
        }

        const data = await res.json();
        setCatalog(data);
        setError(null);
      } catch (err: any) {
        console.error('Catalog load error:', err);
        setError(err.message || 'Catalog unavailable');
      } finally {
        setLoading(false);
      }
    };

    void load();
    void loadRazorpayScript().catch((err) => console.warn('Razorpay script error', err));
  }, [slug]);

  const accentColor = catalog?.settings.accent_color || '#0ea5e9';

  const featuredProducts = useMemo(() => {
    if (!catalog) return [];
    return catalog.products.filter((product) => product.catalog_featured);
  }, [catalog]);

  const nonFeaturedProducts = useMemo(() => {
    if (!catalog) return [];
    return catalog.products.filter((product) => !product.catalog_featured);
  }, [catalog]);

  const handleOpenCheckout = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      note: '',
      quantity: 1,
    });
    setIsDialogOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedProduct || !catalog) return;
    if (!form.name || !form.phone) {
      toast({
        title: 'Missing details',
        description: 'Name and phone are required to place the order.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingPayment(true);
      await loadRazorpayScript();

      const response = await fetch('/api/catalog/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          productId: selectedProduct.id,
          quantity: form.quantity || 1,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: form.address,
          note: form.note,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      const options = {
        key: data.razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: catalog.settings.business_name,
        description: selectedProduct.name,
        order_id: data.orderId,
        notes: {
          catalog_slug: slug,
          product_id: selectedProduct.id,
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: accentColor,
        },
        handler: async (paymentResponse: any) => {
          try {
            const verifyResponse = await fetch('/api/catalog/verify-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                catalogOrderId: data.catalogOrderId,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            setIsDialogOpen(false);
            toast({
              title: 'Payment successful',
              description: 'You will receive a confirmation shortly.',
            });
            setProcessingPayment(false);
          } catch (verifyError: any) {
            console.error('Verification error', verifyError);
            toast({
              title: 'Payment received but verification failed',
              description: verifyError.message,
              variant: 'destructive',
            });
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on('payment.failed', (response: any) => {
        console.error('Catalog payment failed:', response.error);
        toast({
          title: 'Payment failed',
          description: response.error?.description || 'Your payment could not be completed.',
          variant: 'destructive',
        });
        setProcessingPayment(false);
      });
      razorpayCheckout.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Unable to start payment',
        description: err.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
      setProcessingPayment(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const price =
      product.catalog_price !== null && product.catalog_price !== undefined
        ? product.catalog_price
        : product.price;

    return (
      <Card
        key={product.id}
        className="overflow-hidden h-full flex flex-col border-emerald-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        {product.image_url && (
          <div className="relative h-52 w-full">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.catalog_badge && (
              <span className="absolute top-4 left-4 bg-white/90 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full shadow">
                {product.catalog_badge}
              </span>
            )}
          </div>
        )}
        <CardContent className="flex flex-col flex-1 p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              {product.catalog_featured && (
                <Badge className="bg-amber-100 text-amber-600 border-0">Featured</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {product.catalog_description || product.description || 'Ships within 2-4 days.'}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">Price</p>
            <p className="text-3xl font-bold text-gray-900">₹{price.toFixed(2)}</p>
          </div>
          <Button
            className="w-full mt-auto"
            style={{ backgroundColor: accentColor, borderColor: accentColor }}
            onClick={() => handleOpenCheckout(product)}
          >
            {product.catalog_button_label || catalog?.settings.cta_text || 'Place order'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Catalog unavailable</h1>
        <p className="text-gray-500 mb-6">{error || 'This catalog is currently offline.'}</p>
        <Button asChild>
          <a href="/">Go back home</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-96 opacity-40 blur-3xl"
            style={{ background: `radial-gradient(circle at 20% 20%, ${accentColor}, transparent)` }}
          />
          <header className="relative z-10 px-6 pt-12 pb-24 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Powered by BizMitra Catalog
                </div>
                <div className="flex items-center gap-3">
                  {catalog.settings.logo_url && (
                    <Image
                      src={catalog.settings.logo_url}
                      alt={catalog.settings.business_name}
                      width={64}
                      height={64}
                      className="rounded-2xl border border-white/30"
                    />
                  )}
                  <div>
                    <p className="text-sm text-white/70">Presented by</p>
                    <h1 className="text-4xl font-bold">{catalog.settings.business_name}</h1>
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-semibold">
                    {catalog.settings.headline || 'Order the products you love, instantly.'}
                  </h2>
                  <p className="text-white/70 text-lg max-w-2xl">
                    {catalog.settings.subheading ||
                      'Curated catalog tailored for you. Secure Razorpay checkout, doorstep delivery.'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    {catalog.settings.whatsapp_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {catalog.settings.whatsapp_number}
                      </div>
                    )}
                    {catalog.settings.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {catalog.settings.contact_email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {catalog.settings.hero_image_url && (
                <div className="relative w-full md:w-80 h-56 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                  <Image
                    src={catalog.settings.hero_image_url}
                    alt="Hero"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </header>
        </div>

        <main className="bg-white text-gray-900 rounded-t-[40px] mt-[-80px] relative z-20 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-6xl mx-auto space-y-12">
            {featuredProducts.length > 0 && (
              <section className="space-y-4 pt-12">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h3 className="text-xl font-semibold">Featured picks</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredProducts.map(renderProductCard)}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-semibold">All products</h3>
              </div>
              {nonFeaturedProducts.length === 0 && featuredProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-16 border rounded-3xl">
                  Catalog is getting ready. Check back soon!
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {nonFeaturedProducts.map(renderProductCard)}
                </div>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <Card className="border-emerald-100">
                <CardContent className="p-6 space-y-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  <h4 className="text-lg font-semibold">Secure checkout</h4>
                  <p className="text-gray-600">
                    Payments are processed securely via Razorpay. No auto-debits—pay only for what you
                    order.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-emerald-100">
                <CardContent className="p-6 space-y-4">
                  <MapPin className="h-8 w-8 text-emerald-600" />
                  <h4 className="text-lg font-semibold">Pan-India delivery</h4>
                  <p className="text-gray-600">
                    Share your shipping address during checkout and get doorstep delivery with live updates.
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Secure checkout</DialogTitle>
            <DialogDescription>
              Complete the details below to place your order for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Phone / WhatsApp"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Textarea
              placeholder="Shipping address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value) || 1,
                  }))
                }
                placeholder="Quantity"
              />
              <Input
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Custom note (optional)"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={processingPayment}>
              {processingPayment && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Pay securely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


