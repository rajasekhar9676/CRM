-- Check users with specific subscription plans
-- Run this in Supabase SQL Editor

-- Check all users with Starter plan
SELECT 
  u.id,
  u.email,
  u.name,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at,
  s.updated_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan = 'starter'
ORDER BY s.created_at DESC;

-- Check all users with Pro plan
SELECT 
  u.id,
  u.email,
  u.name,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at,
  s.updated_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan = 'pro'
ORDER BY s.created_at DESC;

-- Check all users with Business plan
SELECT 
  u.id,
  u.email,
  u.name,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at,
  s.updated_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan = 'business'
ORDER BY s.created_at DESC;

-- Check all users with Free plan
SELECT 
  u.id,
  u.email,
  u.name,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at,
  s.updated_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan = 'free'
ORDER BY s.created_at DESC;

-- Check all paid plans (non-free)
SELECT 
  u.id,
  u.email,
  u.name,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  s.created_at,
  s.updated_at
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan IN ('starter', 'pro', 'business')
ORDER BY s.plan, s.created_at DESC;

-- Summary: Count users by plan
SELECT 
  s.plan,
  COUNT(DISTINCT s.user_id) as user_count,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN s.razorpay_subscription_id IS NOT NULL THEN 1 END) as has_razorpay_id
FROM subscriptions s
GROUP BY s.plan
ORDER BY 
  CASE s.plan
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'business' THEN 4
  END;

-- Check subscriptions with missing data
SELECT 
  u.email,
  s.plan,
  s.status,
  s.razorpay_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.next_due_date,
  CASE 
    WHEN s.razorpay_subscription_id IS NULL THEN 'Missing Subscription ID'
    WHEN s.current_period_start IS NULL THEN 'Missing Period Start'
    WHEN s.current_period_end IS NULL THEN 'Missing Period End'
    WHEN s.next_due_date IS NULL THEN 'Missing Next Due Date'
    ELSE 'All data present'
  END as missing_data
FROM users u
INNER JOIN subscriptions s ON s.user_id = u.id
WHERE s.plan IN ('starter', 'pro', 'business')
  AND (
    s.razorpay_subscription_id IS NULL
    OR s.current_period_start IS NULL
    OR s.current_period_end IS NULL
    OR s.next_due_date IS NULL
  )
ORDER BY s.plan, u.email;

