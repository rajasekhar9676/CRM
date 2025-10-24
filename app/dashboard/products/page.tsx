'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Loader2,
  Upload,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { ImportModal } from '@/components/ui/ImportModal';
import { exportToExcel } from '@/lib/excel-utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user) {
      fetchProducts();
    }
  }, [session, status, router]);

  const fetchProducts = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', (session?.user as any)?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', (session?.user as any)?.id);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
        return;
      }

      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleExportProducts = () => {
    const exportData = products.map(product => ({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: product.price,
      sku: product.sku || '',
      status: product.status,
    }));
    
    exportToExcel(exportData, 'products_export', 'Products');
    toast({
      title: "Export successful",
      description: "Products data exported to Excel file.",
    });
  };

  const handleImportProducts = async (importData: any[]) => {
    try {
      const userId = (session?.user as any)?.id;
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each product individually to handle duplicates
      for (const product of importData) {
        try {
          // Check if product with this SKU already exists (only if SKU is provided)
          if (product.sku && product.sku.trim() !== '') {
            const { data: existingProduct } = await supabase
              .from('products')
              .select('id')
              .eq('sku', product.sku.trim())
              .eq('user_id', userId)
              .single();

            if (existingProduct) {
              // Update existing product
              const { error: updateError } = await supabase
                .from('products')
                .update({
                  name: product.name,
                  description: product.description,
                  category: product.category,
                  price: product.price,
                  status: product.status,
                })
                .eq('id', existingProduct.id);

              if (updateError) {
                errorCount++;
                errors.push(`Failed to update product "${product.name}": ${updateError.message}`);
              } else {
                successCount++;
              }
              continue;
            }
          }

          // Insert new product
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              ...product,
              sku: product.sku && product.sku.trim() !== '' ? product.sku.trim() : null,
              user_id: userId,
            });

          if (insertError) {
            if (insertError.code === '23505') {
              // Duplicate key error - skip this product
              skipCount++;
            } else {
              errorCount++;
              errors.push(`Failed to import product "${product.name}": ${insertError.message}`);
            }
          } else {
            successCount++;
          }
        } catch (productError) {
          errorCount++;
          errors.push(`Error processing product "${product.name}": ${productError}`);
        }
      }

      // Refresh products list
      await fetchProducts();

      // Show summary
      if (errorCount > 0) {
        throw new Error(`Import completed with issues:\n- ${successCount} products imported/updated\n- ${skipCount} products skipped (duplicates)\n- ${errorCount} products failed\n\nErrors:\n${errors.join('\n')}`);
      } else {
        toast({
          title: "Import successful",
          description: `${successCount} products imported/updated, ${skipCount} duplicates skipped.`,
        });
      }
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">
              Manage your product catalog and inventory ({products.length} products)
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
              onClick={handleExportProducts}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/products/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Products</p>
                  <p className="text-2xl font-bold text-emerald-700">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Active</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {products.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Tag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Categories</p>
                  <p className="text-2xl font-bold text-amber-700">{categories.length}</p>
                </div>
                <Filter className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Value</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
            <CardDescription>
              Manage your product inventory and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by adding your first product.'}
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/dashboard/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {product.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                            {product.category && (
                              <Badge variant="outline">{product.category}</Badge>
                            )}
                          </div>
                        </div>
                        {product.image_url ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden ml-4">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center ml-4">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold text-emerald-600">
                            ${product.price.toFixed(2)}
                          </p>
                          {product.sku && (
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/dashboard/products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportProducts}
          type="products"
          title="Import Products"
          description="Upload an Excel file to import product data. Download the template to see the correct format."
        />
      </div>
    </DashboardLayout>
  );
}
