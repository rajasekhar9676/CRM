'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, X, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Users, ShoppingCart, Package } from 'lucide-react';
import { parseExcelFile, validateCustomerData, validateOrderData, validateProductData } from '@/lib/excel-utils';
import { useToast } from '@/hooks/use-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  type: 'customers' | 'orders' | 'products';
  title: string;
  description: string;
}

export function ImportModal({ isOpen, onClose, onImport, type, title, description }: ImportModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: any[];
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx, .xls) or CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const data = await parseExcelFile(selectedFile);
      
      // Validate data based on type
      let validation;
      switch (type) {
        case 'customers':
          validation = validateCustomerData(data);
          break;
        case 'orders':
          validation = validateOrderData(data);
          break;
        case 'products':
          validation = validateProductData(data);
          break;
        default:
          throw new Error('Invalid type');
      }

      setValidationResults(validation);

      if (validation.valid.length === 0) {
        toast({
          title: "No valid data found",
          description: "Please check your file format and try again.",
          variant: "destructive",
        });
      } else if (validation.errors.length > 0) {
        toast({
          title: "Validation warnings",
          description: `${validation.valid.length} valid records found, ${validation.errors.length} errors found.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "File validated",
          description: `${validation.valid.length} records ready to import.`,
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error parsing file",
        description: "Please check your file format and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.valid.length === 0) return;

    setLoading(true);
    try {
      await onImport(validationResults.valid);
      toast({
        title: "Import successful",
        description: `${validationResults.valid.length} records imported successfully.`,
      });
      handleClose();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationResults(null);
    onClose();
  };

  const downloadTemplate = () => {
    const { generateCustomerTemplate, generateOrderTemplate, generateProductTemplate } = require('@/lib/excel-utils');
    
    switch (type) {
      case 'customers':
        generateCustomerTemplate();
        break;
      case 'orders':
        generateOrderTemplate();
        break;
      case 'products':
        generateProductTemplate();
        break;
    }
  };

  const renderDataPreview = () => {
    if (!validationResults || validationResults.valid.length === 0) return null;

    const data = validationResults.valid.slice(0, 5); // Show first 5 items
    const hasMore = validationResults.valid.length > 5;

    const getIcon = () => {
      switch (type) {
        case 'customers': return <Users className="h-4 w-4" />;
        case 'orders': return <ShoppingCart className="h-4 w-4" />;
        case 'products': return <Package className="h-4 w-4" />;
        default: return <CheckCircle className="h-4 w-4" />;
      }
    };

    const renderItem = (item: any, index: number) => {
      switch (type) {
        case 'customers':
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.email && `${item.email} • `}
                    {item.phone && `${item.phone}`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready to import
              </Badge>
            </div>
          );

        case 'orders':
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.customer_name}</p>
                  <p className="text-sm text-gray-500">
                    ${item.total_amount} • {item.status} • {item.due_date}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready to import
              </Badge>
            </div>
          );

        case 'products':
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ${item.price} • {item.category} • {item.status}
                    {item.sku && ` • ${item.sku}`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready to import
              </Badge>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              {getIcon()}
              <span>Data Preview</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-1"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Showing {data.length} of {validationResults.valid.length} valid records
            {hasMore && ` (${validationResults.valid.length - data.length} more...)`}
          </p>
        </CardHeader>
        {showPreview && (
          <CardContent className="space-y-2">
            {data.map((item, index) => renderItem(item, index))}
            {hasMore && (
              <div className="text-center py-2 text-sm text-gray-500">
                ... and {validationResults.valid.length - data.length} more records
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {type === 'customers' && <Users className="h-5 w-5 text-blue-600" />}
              {type === 'orders' && <ShoppingCart className="h-5 w-5 text-green-600" />}
              {type === 'products' && <Package className="h-5 w-5 text-purple-600" />}
              <span>{title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Template Download */}
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-gray-500">Get the correct Excel format with examples</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file" className="text-sm font-medium">Select Your Excel File</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
              className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            />
            <p className="text-xs text-gray-500">
              Supported formats: .xlsx, .xls, .csv (Max 10MB)
            </p>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-4">
              <Alert className={validationResults.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                <div className="flex items-start space-x-3">
                  {validationResults.errors.length > 0 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-lg">
                        {validationResults.valid.length} records ready to import
                      </span>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Valid
                      </Badge>
                    </div>
                    
                    {validationResults.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-yellow-800 mb-2">
                          {validationResults.errors.length} issues found:
                        </p>
                        <div className="bg-yellow-100 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <ul className="text-xs text-yellow-800 space-y-1">
                            {validationResults.errors.slice(0, 10).map((error, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-yellow-600 mt-1">•</span>
                                <span className="flex-1">{error}</span>
                              </li>
                            ))}
                            {validationResults.errors.length > 10 && (
                              <li className="text-yellow-600 font-medium">
                                ... and {validationResults.errors.length - 10} more issues
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>

              {/* Data Preview */}
              {renderDataPreview()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResults || validationResults.valid.length === 0 || loading}
              className="flex items-center gap-2 px-6"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <CheckCircle className="h-4 w-4" />
              Import {validationResults?.valid.length || 0} Records
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

