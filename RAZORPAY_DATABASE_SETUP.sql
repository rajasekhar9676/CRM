-- Razorpay Database Setup
-- Run this SQL script in your Supabase SQL Editor to add Razorpay support to your subscriptions table

-- Add Razorpay columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_razorpay_subscription_id 
ON subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_customer_id 
ON subscriptions(razorpay_customer_id);

-- Add new status values if needed (optional, as 'created' and 'pending' might not exist in your enum)
-- If you're using an ENUM type for status, you might need to alter it
-- Uncomment and modify based on your schema:
-- ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'created';
-- ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending';

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('razorpay_subscription_id', 'razorpay_customer_id');

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Razorpay columns successfully added to subscriptions table!';
END $$;


