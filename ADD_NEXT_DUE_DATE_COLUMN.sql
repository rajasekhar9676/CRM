-- Add next_due_date column to subscriptions table
-- This stores the timestamp for the next billing/charge date from Razorpay

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date 
ON subscriptions(next_due_date);

-- Comment the column
COMMENT ON COLUMN subscriptions.next_due_date IS 'Next billing/charge date from Razorpay subscription (charge_at field)';

