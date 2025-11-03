-- Quick check: Does next_due_date column exist?
-- Run this FIRST to see if you need to add the column

-- Query 1: Check if column exists
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name = 'next_due_date';

-- Query 2: Check if any subscriptions have next_due_date populated
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(next_due_date) as with_next_due_date,
  COUNT(*) - COUNT(next_due_date) as missing_next_due_date
FROM subscriptions
WHERE razorpay_subscription_id IS NOT NULL;

-- If column doesn't exist OR count returns 0 rows:
-- → Run: ADD_NEXT_DUE_DATE_COLUMN.sql
--
-- If column exists:
-- → Use: VERIFY_NEXT_DUE_DATE.sql (optional, just for verification)


