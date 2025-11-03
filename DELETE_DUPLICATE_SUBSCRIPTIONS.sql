-- Delete duplicate subscriptions and keep only active ones
-- ⚠️ REVIEW BEFORE RUNNING - This will delete subscriptions!

-- Step 1: Find duplicate subscriptions for the same user
SELECT 
  user_id,
  COUNT(*) as subscription_count,
  STRING_AGG(id::text, ', ') as subscription_ids,
  STRING_AGG(status, ', ') as statuses,
  STRING_AGG(razorpay_subscription_id, ', ') as razorpay_ids
FROM subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Step 2: Find duplicate subscriptions with same razorpay_subscription_id
SELECT 
  razorpay_subscription_id,
  COUNT(*) as count,
  STRING_AGG(user_id::text, ', ') as user_ids,
  STRING_AGG(id::text, ', ') as subscription_ids
FROM subscriptions
WHERE razorpay_subscription_id IS NOT NULL
GROUP BY razorpay_subscription_id
HAVING COUNT(*) > 1;

-- Step 3: DELETE duplicate subscriptions - Keep only ACTIVE one per user
-- ⚠️ CAREFUL: This will delete subscriptions. Review Step 1 and Step 2 first!

-- For each user, keep only the active subscription (or latest if multiple active)
DELETE FROM subscriptions
WHERE id IN (
  SELECT s2.id
  FROM subscriptions s1
  INNER JOIN subscriptions s2 ON s2.user_id = s1.user_id
  WHERE s1.status = 'active'
    AND s1.razorpay_subscription_id IS NOT NULL
    AND s2.id != s1.id
    AND s2.status IN ('active', 'pending', 'created')
);

-- Step 4: DELETE pending/created subscriptions (subscriptions created before payment)
-- ⚠️ Only run this if payment never succeeded
DELETE FROM subscriptions
WHERE status IN ('created', 'pending')
  AND razorpay_subscription_id IS NOT NULL;

-- Step 5: DELETE subscriptions without razorpay_subscription_id for paid plans
-- ⚠️ These are dummy subscriptions
DELETE FROM subscriptions
WHERE razorpay_subscription_id IS NULL
  AND plan IN ('starter', 'pro', 'business');

-- Step 6: Verify - Count remaining subscriptions
SELECT 
  plan,
  status,
  COUNT(*) as count
FROM subscriptions
GROUP BY plan, status
ORDER BY plan, status;

-- Step 7: List all remaining subscriptions
SELECT 
  u.email,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.created_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
ORDER BY s.created_at DESC;

