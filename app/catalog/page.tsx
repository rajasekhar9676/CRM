'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Product, CatalogSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  ExternalLink,
  Loader2,
  Palette,
  Share2,
  ShoppingBag,
  Wand2,
  Zap,
} from 'lucide-react';
import Image from 'next/image';

interface CatalogFormState {
  businessName: string;
  headline: string;
  subheading: string;
  slug: string;
  accentColor: string;
  heroImageUrl: string;
  logoUrl: string;
  whatsappNumber: string;
  contactEmail: string;
  ctaText: string;
}

const defaultForm: CatalogFormState = {
  businessName: '',
  headline: 'Handcrafted products shipped with love',
  subheading: 'Browse our catalog and place your order in minutes.',
  slug: '',
  accentColor: '#10b981',
  heroImageUrl: '',
  logoUrl: '',
  whatsappNumber: '',
  contactEmail: '',
  ctaText: 'Order now',
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'my-store';
}

export default function CatalogBuilderPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CatalogSettings | null>(null);
  const [form, setForm] = useState<CatalogFormState>(defaultForm);
  const [productSavingId, setProductSavingId] = useState<string | null>(null);

  const catalogUrl = useMemo(() => {
    if (!form.slug) return '';
    if (typeof window === 'undefined') return `${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${form.slug}`;
    return `${window.location.origin}/c/${form.slug}`;
  }, [form.slug]);

  useEffect(() => {
    if (status === 'authenticated') {
      void fetchInitialData();
    }
  }, [status]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [settingsRes, productsRes] = await Promise.all([
        fetch('/api/catalog/settings'),
        fetch('/api/catalog/products'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          setSettings(data.settings);
          setForm({
            businessName: data.settings.business_name,
            headline: data.settings.headline || defaultForm.headline,
            subheading: data.settings.subheading || defaultForm.subheading,
            slug: data.settings.slug,
            accentColor: data.settings.accent_color || defaultForm.accentColor,
            heroImageUrl: data.settings.hero_image_url || '',
            logoUrl: data.settings.logo_url || '',
            whatsappNumber: data.settings.whatsapp_number || '',
            contactEmail: data.settings.contact_email || '',
            ctaText: data.settings.cta_text || defaultForm.ctaText,
          });
        } else if (session?.user?.name) {
          setForm((current) => ({
            ...current,
            businessName: session.user.name || 'My Business',
            slug: slugify(session.user.name || 'My Business'),
          }));
        }
      } else {
        console.warn('Failed to fetch catalog settings');
      }

      if (productsRes.ok) {
        const productPayload = await productsRes.json();
        setProducts(productPayload.products || []);
      }
    } catch (error) {
      console.error('Error loading catalog data:', error);
      toast({
        title: 'Unable to load catalog data',
        description: 'Please refresh the page and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof CatalogFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateSlug = () => {
    if (!form.businessName) {
      toast({
        title: 'Enter business name',
        description: 'Add your business name first so we can create a URL slug.',
      });
      return;
    }
    const generated = slugify(form.businessName);
    setForm((prev) => ({ ...prev, slug: generated }));
  };

  const handleSaveSettings = async () => {
    if (!form.businessName || !form.slug) {
      toast({
        title: 'Missing information',
        description: 'Business name and catalog URL are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/catalog/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          headline: form.headline,
          subheading: form.subheading,
          slug: form.slug,
          accentColor: form.accentColor,
          heroImageUrl: form.heroImageUrl,
          logoUrl: form.logoUrl,
          whatsappNumber: form.whatsappNumber,
          contactEmail: form.contactEmail,
          ctaText: form.ctaText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save catalog settings');
      }

      setSettings(data.settings);
      toast({
        title: 'Catalog saved',
        description: 'Your storefront is ready to share.',
      });
    } catch (error: any) {
      console.error('Catalog save error:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save catalog settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!catalogUrl) return;
    try {
      await navigator.clipboard.writeText(catalogUrl);
      toast({
        title: 'Catalog link copied',
        description: 'Share it with your customers to start collecting orders.',
      });
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  const handleProductUpdate = async (
    productId: string,
    updates: Partial<Product>
  ) => {
    try {
      setProductSavingId(productId);
      const response = await fetch('/api/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, updates }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update product');
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, ...updates } : product
        )
      );
      toast({
        title: 'Product updated',
        description: 'Changes saved to your storefront.',
      });
    } catch (error: any) {
      console.error('Product update error:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Could not update product.',
        variant: 'destructive',
      });
    } finally {
      setProductSavingId(null);
    }
  };

  const catalogProducts = useMemo(
    () =>
      products
        .filter((product) => product.show_in_catalog)
        .sort((a, b) => (a.catalog_sort_order || 0) - (b.catalog_sort_order || 0)),
    [products]
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 p-6 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_50%)]" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              New: Customer-facing catalog
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Launch a storefront with one click
            </h1>
            <p className="text-lg text-emerald-50">
              Curate products, share a branded link, and accept payments—all without
              leaving BizMitra.
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/15 text-white border border-white/30">
                24/7 ordering
              </Badge>
              <Badge className="bg-white/15 text-white border border-white/30">
                Razorpay checkout
              </Badge>
              <Badge className="bg-white/15 text-white border border-white/30">
                Automatic order log
              </Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shareable catalog link</CardTitle>
            <CardDescription>Send this to customers to let them order instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-sm font-mono text-gray-700 break-all">
                {catalogUrl || 'Set a business name to generate your URL'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyLink} disabled={!catalogUrl}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                {catalogUrl && (
                  <Button asChild variant="secondary">
                    <a href={catalogUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4 flex items-center gap-3">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Products live</p>
                  <p className="text-xl font-semibold">{catalogProducts.length}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4 flex items-center gap-3">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Accent color</p>
                  <p className="text-xl font-semibold">{form.accentColor}</p>
                </div>
              </div>
              <div className="rounded-xl border p-4 flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">Status</p>
                  <p className="text-xl font-semibold">
                    {settings ? 'Ready to share' : 'Draft'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand & hero content</CardTitle>
            <CardDescription>Personalize the storefront experience for your buyers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Business name</label>
                <Input
                  value={form.businessName}
                  onChange={(e) => handleFormChange('businessName', e.target.value)}
                  placeholder="Ex: Thrive Creations"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Catalog URL</label>
                <div className="flex gap-2">
                  <Input
                    value={form.slug}
                    onChange={(e) => handleFormChange('slug', slugify(e.target.value))}
                    placeholder="your-brand"
                  />
                  <Button variant="outline" onClick={handleGenerateSlug}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Auto
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Headline</label>
                <Input
                  value={form.headline}
                  onChange={(e) => handleFormChange('headline', e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Subheading</label>
                <Input
                  value={form.subheading}
                  onChange={(e) => handleFormChange('subheading', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Accent color</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border"
                    style={{ backgroundColor: form.accentColor }}
                  />
                  <Input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => handleFormChange('accentColor', e.target.value)}
                    className="w-24 p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Primary CTA text</label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => handleFormChange('ctaText', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Hero image URL</label>
                <Input
                  value={form.heroImageUrl}
                  onChange={(e) => handleFormChange('heroImageUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Logo URL (optional)</label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => handleFormChange('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">WhatsApp number</label>
                <Input
                  value={form.whatsappNumber}
                  onChange={(e) => handleFormChange('whatsappNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Customer email</label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                  placeholder="support@yourbrand.com"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save catalog
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products in your catalog</CardTitle>
            <CardDescription>
              Toggle which items appear on the public page. Prices can be customized per product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-2xl p-4 flex gap-4 items-start hover:border-emerald-200 transition"
                >
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">₹{product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!product.show_in_catalog}
                            onChange={(e) =>
                              handleProductUpdate(product.id, {
                                show_in_catalog: e.target.checked,
                              })
                            }
                          />
                          Show
                        </label>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!product.show_in_catalog}
                        value={
                          product.catalog_price !== null &&
                          product.catalog_price !== undefined
                            ? product.catalog_price
                            : ''
                        }
                        placeholder="Catalog price (use product price if empty)"
                        onChange={(e) =>
                          handleProductUpdate(product.id, {
                            catalog_price: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                      <Input
                        disabled={!product.show_in_catalog}
                        value={product.catalog_badge || ''}
                        placeholder="Badge (e.g., Bestseller)"
                        onChange={(e) =>
                          handleProductUpdate(product.id, {
                            catalog_badge: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <Textarea
                      disabled={!product.show_in_catalog}
                      value={product.catalog_description || product.description || ''}
                      placeholder="Short highlight for this product"
                      onChange={(e) =>
                        handleProductUpdate(product.id, {
                          catalog_description: e.target.value,
                        })
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="number"
                        disabled={!product.show_in_catalog}
                        value={product.catalog_sort_order ?? ''}
                        placeholder="Display order (0 = top)"
                        onChange={(e) =>
                          handleProductUpdate(product.id, {
                            catalog_sort_order: e.target.value
                              ? Number(e.target.value)
                              : 0,
                          })
                        }
                      />
                      <Input
                        disabled={!product.show_in_catalog}
                        value={product.catalog_button_label || form.ctaText}
                        placeholder="Button label"
                        onChange={(e) =>
                          handleProductUpdate(product.id, {
                            catalog_button_label: e.target.value,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        disabled={!product.show_in_catalog}
                        checked={!!product.catalog_featured}
                        onChange={(e) =>
                          handleProductUpdate(product.id, {
                            catalog_featured: e.target.checked,
                          })
                        }
                      />
                      Feature this product in hero row
                    </label>
                    {productSavingId === product.id && (
                      <div className="text-xs text-emerald-600 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving…
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Add products first from the Products screen to showcase them here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>This is what customers will see.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-3xl overflow-hidden shadow-xl">
              <div
                className="p-8 text-white relative overflow-hidden"
                style={{ backgroundColor: form.accentColor || '#0ea5e9' }}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_white,_transparent_60%)]" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    {form.logoUrl && (
                      <Image
                        src={form.logoUrl}
                        alt={form.businessName}
                        width={48}
                        height={48}
                        className="rounded-full border border-white/40"
                      />
                    )}
                    <div>
                      <p className="text-xl font-semibold">{form.businessName || 'Your brand'}</p>
                      <p className="text-sm text-white/80">{form.subheading}</p>
                    </div>
                  </div>
                  <div className="max-w-2xl space-y-3">
                    <h2 className="text-3xl font-bold">{form.headline}</h2>
                    <p className="text-white/90 text-lg">
                      {form.subheading ||
                        'Add a short pitch for your catalog to build trust instantly.'}
                    </p>
                    <Button className="bg-white text-gray-900 hover:bg-white/90">
                      {form.ctaText || 'Order now'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-2">
                {catalogProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="border rounded-2xl overflow-hidden">
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {product.catalog_badge && (
                          <Badge variant="outline" className="text-xs">
                            {product.catalog_badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {product.catalog_description || product.description || 'Add a description'}
                      </p>
                      <p className="text-2xl font-bold">
                        ₹
                        {(
                          product.catalog_price !== null &&
                          product.catalog_price !== undefined
                            ? product.catalog_price
                            : product.price
                        ).toFixed(2)}
                      </p>
                      <Button className="w-full">
                        {product.catalog_button_label || form.ctaText || 'Order now'}
                      </Button>
                    </div>
                  </div>
                ))}
                {catalogProducts.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-12">
                    Enable at least one product to see the preview.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


