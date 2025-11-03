-- Fix subscription fetching by ensuring all required columns exist
-- Run this SQL in Supabase SQL Editor

-- Add missing Razorpay columns if they don't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_customer_id TEXT,
ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;

-- Create index on razorpay_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_subscription_id 
ON subscriptions(razorpay_subscription_id);

-- Create index on next_due_date
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date 
ON subscriptions(next_due_date);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name IN (
  'razorpay_subscription_id',
  'razorpay_customer_id',
  'next_due_date',
  'current_period_start',
  'current_period_end'
)
ORDER BY column_name;

