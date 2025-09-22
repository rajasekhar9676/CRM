-- Complete Database Setup for MiniCRM Admin Panel
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 3: Make the first user (oldest) an admin
UPDATE users 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Step 4: Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create profiles table (for future use)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS on new tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 8: Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Step 9: Create default subscriptions for existing users
INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
SELECT 
  id, 
  CASE 
    WHEN role = 'admin' THEN 'pro'
    ELSE 'free'
  END as plan,
  'active' as status,
  NOW() as current_period_start,
  NOW() + INTERVAL '30 days' as current_period_end
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions);

-- Step 10: Create profiles for existing users
INSERT INTO profiles (id, email, name, role)
SELECT 
  id,
  email,
  name,
  COALESCE(role, 'user') as role
FROM users
WHERE id NOT IN (SELECT id FROM profiles);

-- Step 11: Verify the setup
SELECT 
  'Users with roles:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM users;

SELECT 
  'Subscriptions created:' as info,
  COUNT(*) as total_subscriptions
FROM subscriptions;

SELECT 
  'Profiles created:' as info,
  COUNT(*) as total_profiles
FROM profiles;
