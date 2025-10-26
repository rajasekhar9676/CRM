'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Mail, Phone, MapPin, Instagram, FileText, Tag } from 'lucide-react';
import { Customer } from '@/types';

interface CustomerViewModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerViewModal({ customer, isOpen, onClose }: CustomerViewModalProps) {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Customer Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <span className="font-semibold text-gray-900">Name: </span>
                  <span className="text-gray-600">{customer.name}</span>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-gray-900">{customer.email}</div>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="text-gray-900">{customer.phone}</div>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="text-gray-900">{customer.address}</div>
                  </div>
                </div>
              )}

              {customer.insta_handle && (
                <div className="flex items-start space-x-3">
                  <Instagram className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Instagram</div>
                    <div className="text-gray-900">{customer.insta_handle}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Notes</h3>
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Customer ID</div>
                <div className="text-gray-900 font-mono">{customer.id.slice(0, 8)}...</div>
              </div>
              <div>
                <div className="text-gray-500">Created On</div>
                <div className="text-gray-900">{new Date(customer.created_at).toLocaleDateString()}</div>
              </div>
              {customer.updated_at !== customer.created_at && (
                <div>
                  <div className="text-gray-500">Last Updated</div>
                  <div className="text-gray-900">{new Date(customer.updated_at).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

