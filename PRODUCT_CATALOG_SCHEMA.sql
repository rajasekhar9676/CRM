-- Product Catalog + Storefront schema
-- Run inside Supabase SQL editor after reviewing. This script creates
-- catalog settings, catalog orders, and extends products with public
-- catalog metadata.

-- 1. Extend products table with catalog-specific fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS show_in_catalog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS catalog_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS catalog_badge TEXT,
ADD COLUMN IF NOT EXISTS catalog_description TEXT,
ADD COLUMN IF NOT EXISTS catalog_button_label TEXT,
ADD COLUMN IF NOT EXISTS catalog_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS catalog_sort_order INTEGER DEFAULT 0;

-- 2. Catalog settings (one row per business/user)
CREATE TABLE IF NOT EXISTS product_catalog_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  headline TEXT,
  subheading TEXT,
  accent_color TEXT DEFAULT '#10b981',
  hero_image_url TEXT,
  logo_url TEXT,
  whatsapp_number TEXT,
  contact_email TEXT,
  cta_text TEXT DEFAULT 'Place Order',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_settings_user_id ON product_catalog_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_settings_slug ON product_catalog_settings(slug);

ALTER TABLE product_catalog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog owners can view settings"
  ON product_catalog_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Catalog owners can insert settings"
  ON product_catalog_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Catalog owners can update settings"
  ON product_catalog_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Catalog owners can delete settings"
  ON product_catalog_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_catalog_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_settings_updated_at ON product_catalog_settings;
CREATE TRIGGER trg_catalog_settings_updated_at
  BEFORE UPDATE ON product_catalog_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_settings_updated_at();

-- 3. Orders generated via public catalog checkout
CREATE TABLE IF NOT EXISTS catalog_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_slug TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  currency TEXT DEFAULT 'INR',
  amount DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  note TEXT,
  payment_status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_orders_user_id ON catalog_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_orders_slug ON catalog_orders(catalog_slug);

ALTER TABLE catalog_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog owners can manage their orders"
  ON catalog_orders
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_catalog_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_orders_updated_at ON catalog_orders;
CREATE TRIGGER trg_catalog_orders_updated_at
  BEFORE UPDATE ON catalog_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_orders_updated_at();


