'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProductForm } from '@/components/products/ProductForm';
import { Loader2 } from 'lucide-react';

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  const handleSuccess = () => {
    router.push('/dashboard/products');
  };

  const handleCancel = () => {
    router.push('/dashboard/products');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">
            Create a new product for your catalog
          </p>
        </div>

        <ProductForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          userId={(session.user as any)?.id}
        />
      </div>
    </DashboardLayout>
  );
}
