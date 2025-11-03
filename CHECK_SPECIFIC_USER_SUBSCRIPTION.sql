-- Check subscription for a specific user by email
-- Replace 'user@example.com' with the actual email address

-- Check subscription for specific user
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.plan as user_plan,
  s.id as subscription_id,
  s.plan as subscription_plan,
  s.status,
  s.razorpay_subscription_id,
  s.razorpay_customer_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.cancel_at_period_end,
  s.created_at,
  s.updated_at
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'rajasekharm2268@gmail.com'  -- Replace with actual email
ORDER BY s.created_at DESC
LIMIT 1;

-- Check all subscription data for a specific user (including all subscription records)
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.plan as user_plan,
  s.id as subscription_id,
  s.plan as subscription_plan,
  s.status,
  s.razorpay_subscription_id,
  s.razorpay_customer_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.cancel_at_period_end,
  s.created_at as subscription_created_at,
  s.updated_at as subscription_updated_at
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'rajasekharm2268@gmail.com'  -- Replace with actual email
ORDER BY s.created_at DESC;

