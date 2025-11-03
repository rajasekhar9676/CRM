-- Clean up duplicate and dummy subscriptions
-- Keep only ACTIVE subscriptions from successful payments
-- Run this in Supabase SQL Editor

-- Step 1: Find duplicate subscriptions (multiple subscriptions for same user or same razorpay_subscription_id)
SELECT 
  user_id,
  razorpay_subscription_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as subscription_ids,
  STRING_AGG(status, ', ') as statuses
FROM subscriptions
WHERE razorpay_subscription_id IS NOT NULL
GROUP BY user_id, razorpay_subscription_id
HAVING COUNT(*) > 1;

-- Step 2: Find pending/created subscriptions that should not exist (no payment yet)
SELECT 
  id,
  user_id,
  plan,
  status,
  razorpay_subscription_id,
  created_at
FROM subscriptions
WHERE status IN ('created', 'pending')
  AND razorpay_subscription_id IS NOT NULL
ORDER BY created_at DESC;

-- Step 3: Find subscriptions without razorpay_subscription_id (dummy/free subscriptions that shouldn't be there)
SELECT 
  id,
  user_id,
  plan,
  status,
  razorpay_subscription_id,
  created_at
FROM subscriptions
WHERE razorpay_subscription_id IS NULL
  AND plan != 'free'
ORDER BY created_at DESC;

-- Step 4: Delete duplicate subscriptions - Keep only the latest ACTIVE one
-- ⚠️ CAREFUL: This deletes subscriptions. Review first!

-- First, identify duplicates for a specific user
SELECT 
  s1.id as subscription_id_to_keep,
  s2.id as subscription_id_to_delete,
  s1.user_id,
  s1.razorpay_subscription_id,
  s1.status as status_to_keep,
  s2.status as status_to_delete,
  s1.created_at as created_to_keep,
  s2.created_at as created_to_delete
FROM subscriptions s1
INNER JOIN subscriptions s2 ON s2.razorpay_subscription_id = s1.razorpay_subscription_id
WHERE s1.id != s2.id
  AND s1.razorpay_subscription_id IS NOT NULL
  AND s1.created_at > s2.created_at  -- Keep the newer one
ORDER BY s1.razorpay_subscription_id, s1.created_at DESC;

-- Step 5: Delete pending/created subscriptions (subscriptions created before payment)
-- ⚠️ CAREFUL: Only delete if payment never succeeded
DELETE FROM subscriptions
WHERE status IN ('created', 'pending')
  AND razorpay_subscription_id IS NOT NULL
  AND id NOT IN (
    -- Keep if there's an active subscription with same razorpay_subscription_id
    SELECT id FROM subscriptions s2
    WHERE s2.status = 'active'
    AND s2.razorpay_subscription_id = subscriptions.razorpay_subscription_id
  );

-- Step 6: Delete duplicate subscriptions for same user - Keep only active one
-- ⚠️ CAREFUL: Run this only after reviewing Step 4 results
DELETE FROM subscriptions
WHERE id IN (
  SELECT s2.id
  FROM subscriptions s1
  INNER JOIN subscriptions s2 ON s2.user_id = s1.user_id
  WHERE s1.razorpay_subscription_id = s2.razorpay_subscription_id
    AND s1.razorpay_subscription_id IS NOT NULL
    AND s1.status = 'active'
    AND s2.id != s1.id
);

-- Step 7: Verify cleanup - Check remaining subscriptions
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN razorpay_subscription_id IS NOT NULL THEN 1 END) as with_razorpay_id,
  COUNT(DISTINCT razorpay_subscription_id) as unique_razorpay_subscriptions,
  COUNT(CASE WHEN plan != 'free' THEN 1 END) as paid_subscriptions
FROM subscriptions;

-- Step 8: List all active subscriptions (should be only real ones)
SELECT 
  u.email,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.status = 'active'
  AND s.razorpay_subscription_id IS NOT NULL
ORDER BY s.created_at DESC;

