'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
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

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">Get the correct format</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
              className="cursor-pointer"
            />
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-2">
              <Alert className={validationResults.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {validationResults.valid.length} valid records found
                    </p>
                    {validationResults.errors.length > 0 && (
                      <div>
                        <p className="font-medium text-yellow-800">
                          {validationResults.errors.length} errors found:
                        </p>
                        <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                          {validationResults.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {validationResults.errors.length > 5 && (
                            <li>• ... and {validationResults.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResults || validationResults.valid.length === 0 || loading}
              className="flex items-center gap-2"
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

