-- Fix subscription creation flow
-- This ensures subscriptions are only created after successful payment

-- Step 1: Add UNIQUE constraint to prevent duplicate subscriptions with same Razorpay subscription ID
ALTER TABLE subscriptions 
ADD CONSTRAINT unique_razorpay_subscription_id 
UNIQUE (razorpay_subscription_id);

-- Step 2: Add unique constraint on user_id for active subscriptions (one active subscription per user)
-- Note: Users can have multiple subscriptions if they have canceled ones
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_user 
ON subscriptions(user_id) 
WHERE status = 'active' AND razorpay_subscription_id IS NOT NULL;

-- Step 3: Verify constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'subscriptions'::regclass
AND conname IN ('unique_razorpay_subscription_id');

