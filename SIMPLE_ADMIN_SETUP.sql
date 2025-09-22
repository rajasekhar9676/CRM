-- Simple Admin Setup for MiniCRM
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update existing users to have 'user' role if they don't have one
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

-- Step 4: Verify the setup
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at ASC;
