import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Types for Excel data
export interface CustomerExcelData {
  name: string;
  email?: string;
  phone?: string;
  insta_handle?: string;
  notes?: string;
  tags?: string;
}

export interface OrderExcelData {
  customer_name: string;
  status: string;
  due_date: string;
  total_amount: number;
  notes?: string;
  items: string; // JSON string of items
}

export interface ProductExcelData {
  name: string;
  description?: string;
  category?: string;
  price: number;
  sku?: string;
  status: string;
}

// Export functions
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Data') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(dataBlob, `${filename}.xlsx`);
};

// Import functions
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Validation functions
export const validateCustomerData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      rowErrors.push('Name is required');
    }
    
    if (row.email && typeof row.email !== 'string') {
      rowErrors.push('Email must be a string');
    }
    
    if (row.phone && typeof row.phone !== 'string') {
      rowErrors.push('Phone must be a string');
    }
    
    if (row.tags && typeof row.tags !== 'string') {
      rowErrors.push('Tags must be a string');
    }
    
    if (rowErrors.length === 0) {
      valid.push({
        name: row.name?.trim(),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        insta_handle: row.insta_handle?.trim() || null,
        notes: row.notes?.trim() || null,
        tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      });
    } else {
      errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
    }
  });
  
  return { valid, errors };
};

export const validateOrderData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    if (!row.customer_name || typeof row.customer_name !== 'string' || row.customer_name.trim() === '') {
      rowErrors.push('Customer name is required');
    }
    
    if (!row.status || typeof row.status !== 'string' || !['New', 'In Progress', 'Completed', 'Paid'].includes(row.status)) {
      rowErrors.push('Status must be one of: New, In Progress, Completed, Paid');
    }
    
    if (!row.due_date || typeof row.due_date !== 'string') {
      rowErrors.push('Due date is required');
    }
    
    if (!row.total_amount || isNaN(Number(row.total_amount)) || Number(row.total_amount) < 0) {
      rowErrors.push('Total amount must be a valid number >= 0');
    }
    
    if (rowErrors.length === 0) {
      valid.push({
        customer_name: row.customer_name.trim(),
        status: row.status,
        due_date: row.due_date,
        total_amount: Number(row.total_amount),
        notes: row.notes?.trim() || null,
        items: row.items ? JSON.parse(row.items) : [],
      });
    } else {
      errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
    }
  });
  
  return { valid, errors };
};

export const validateProductData = (data: any[]): { valid: any[], errors: string[] } => {
  const valid: any[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
      rowErrors.push('Name is required');
    }
    
    if (!row.price || isNaN(Number(row.price)) || Number(row.price) < 0) {
      rowErrors.push('Price must be a valid number >= 0');
    }
    
    if (!row.status || typeof row.status !== 'string' || !['active', 'inactive', 'archived'].includes(row.status)) {
      rowErrors.push('Status must be one of: active, inactive, archived');
    }
    
    if (rowErrors.length === 0) {
      valid.push({
        name: row.name.trim(),
        description: row.description?.trim() || null,
        category: row.category?.trim() || null,
        price: Number(row.price),
        sku: row.sku?.trim() || null,
        status: row.status,
      });
    } else {
      errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
    }
  });
  
  return { valid, errors };
};

// Template generation
export const generateCustomerTemplate = () => {
  const template = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      insta_handle: '@johndoe',
      notes: 'VIP customer',
      tags: 'premium, regular'
    }
  ];
  exportToExcel(template, 'customers_template', 'Customers');
};

export const generateOrderTemplate = () => {
  const template = [
    {
      customer_name: 'John Doe',
      status: 'New',
      due_date: '2024-01-15',
      total_amount: 150.00,
      notes: 'Urgent order',
      items: JSON.stringify([{ name: 'Product 1', quantity: 2, price: 75.00 }])
    }
  ];
  exportToExcel(template, 'orders_template', 'Orders');
};

export const generateProductTemplate = () => {
  const template = [
    {
      name: 'Custom Gift Box',
      description: 'A beautiful handmade gift box perfect for special occasions',
      category: 'Gifts',
      price: 25.99,
      sku: 'GIFT-BOX-001',
      status: 'active'
    },
    {
      name: 'Personalized Mug',
      description: 'Custom ceramic mug with your name or message',
      category: 'Personalized',
      price: 15.50,
      sku: '',
      status: 'active'
    }
  ];
  exportToExcel(template, 'products_template', 'Products');
};

