-- Products Management Schema for MiniCRM
-- Run this SQL in your Supabase SQL Editor

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sku VARCHAR(100) UNIQUE,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create RLS (Row Level Security) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own products
CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create products storage bucket (if using Supabase Storage)
-- Note: This needs to be done in the Supabase Dashboard under Storage
-- Bucket name: products
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Sample data (optional - remove in production)
-- INSERT INTO products (user_id, name, description, category, price, sku, status) VALUES
-- ('your-user-id', 'Sample Product 1', 'This is a sample product', 'Electronics', 99.99, 'SKU001', 'active'),
-- ('your-user-id', 'Sample Product 2', 'Another sample product', 'Clothing', 49.99, 'SKU002', 'active');
