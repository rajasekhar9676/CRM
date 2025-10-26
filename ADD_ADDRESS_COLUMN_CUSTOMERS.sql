-- Add address column to customers table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update the updated_at column when address is modified (if you have a trigger for updated_at)
COMMENT ON COLUMN customers.address IS 'Customer address field for delivery and contact information';

