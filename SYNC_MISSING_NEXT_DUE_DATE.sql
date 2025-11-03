-- Find the subscription missing next_due_date
SELECT 
  razorpay_subscription_id,
  plan,
  status,
  next_due_date,
  current_period_start,
  current_period_end,
  created_at
FROM subscriptions
WHERE razorpay_subscription_id IS NOT NULL
  AND next_due_date IS NULL
ORDER BY created_at DESC;

-- After identifying the missing subscription,
-- Use the admin panel "Sync Subscriptions" button
-- OR manually sync via API: POST /api/admin/sync-subscriptions


