'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductForm } from '@/components/products/ProductForm';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user) {
      fetchProduct();
    }
  }, [session, status, router, params.id]);

  const fetchProduct = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', (session?.user as any)?.id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        setError('Product not found or access denied');
        return;
      }

      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/dashboard/products');
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">Product not found</h3>
                <p className="text-gray-600">The product you're looking for doesn't exist.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">
            Update product information and details
          </p>
        </div>

        <ProductForm
          product={product}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          userId={(session.user as any)?.id}
        />
      </div>
    </DashboardLayout>
  );
}
