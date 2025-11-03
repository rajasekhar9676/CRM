-- Check if all required columns exist in subscriptions table
-- Run this in Supabase SQL Editor

-- Check all columns in subscriptions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name IN (
  'id',
  'user_id',
  'plan',
  'status',
  'current_period_start',
  'current_period_end',
  'cancel_at_period_end',
  'razorpay_subscription_id',
  'razorpay_customer_id',
  'stripe_subscription_id',
  'stripe_customer_id',
  'cashfree_subscription_id',
  'cashfree_customer_id',
  'next_due_date',
  'created_at',
  'updated_at'
)
ORDER BY column_name;

-- Count how many subscriptions exist
SELECT COUNT(*) as total_subscriptions FROM subscriptions;

-- Check subscriptions with plans
SELECT 
  plan,
  COUNT(*) as count
FROM subscriptions
GROUP BY plan
ORDER BY plan;

