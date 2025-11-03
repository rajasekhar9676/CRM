-- Verify next_due_date is stored correctly in database
-- Compare with Razorpay subscription details

-- Query 1: Check all subscriptions and their next_due_date
SELECT 
  razorpay_subscription_id,
  plan,
  status,
  next_due_date,
  TO_CHAR(next_due_date, 'DD-MM-YYYY HH24:MI:SS') as next_due_formatted,
  current_period_start,
  TO_CHAR(current_period_start, 'DD-MM-YYYY') as period_start,
  current_period_end,
  TO_CHAR(current_period_end, 'DD-MM-YYYY') as period_end,
  created_at,
  CASE 
    WHEN next_due_date IS NULL THEN '❌ NULL'
    WHEN next_due_date IS NOT NULL THEN '✅ HAS DATE'
  END AS status_check
FROM subscriptions
WHERE razorpay_subscription_id IN ('sub_RarSUeg5caJgNo', 'sub_RarS6g9xwQfldg')
ORDER BY created_at DESC;

-- Query 2: Calculate expected next_due_date from start_at (verification)
SELECT 
  razorpay_subscription_id,
  current_period_start,
  next_due_date,
  -- Expected next_due = start + 1 month
  CASE 
    WHEN current_period_start IS NOT NULL THEN
      (current_period_start + INTERVAL '1 month')::timestamp
    ELSE NULL
  END as calculated_next_due,
  -- Check if our stored date matches calculation
  CASE 
    WHEN next_due_date IS NOT NULL 
      AND current_period_start IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (next_due_date - (current_period_start + INTERVAL '1 month')))) < 86400
    THEN '✅ MATCHES'
    WHEN next_due_date IS NULL THEN '❌ NULL'
    ELSE '⚠️ CHECK'
  END AS calculation_check
FROM subscriptions
WHERE razorpay_subscription_id IN ('sub_RarSUeg5caJgNo', 'sub_RarS6g9xwQfldg');

-- Query 3: Summary for all subscriptions
SELECT 
  COUNT(*) as total,
  COUNT(next_due_date) as with_next_due,
  COUNT(*) - COUNT(next_due_date) as missing_next_due,
  ROUND(COUNT(next_due_date) * 100.0 / COUNT(*), 2) as percentage_synced
FROM subscriptions
WHERE razorpay_subscription_id IS NOT NULL;



