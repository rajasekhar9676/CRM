-- Final Simple Admin Setup for MiniCRM
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 3: Create function to add role column if not exists
CREATE OR REPLACE FUNCTION add_role_column_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
  
  -- Update existing users to have 'user' role
  UPDATE users SET role = 'user' WHERE role IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Grant execute permissions
GRANT EXECUTE ON FUNCTION add_role_column_if_not_exists() TO authenticated;

-- Step 5: Make the first user (you) an admin
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';

-- Step 6: Verify the setup
SELECT 
  id, 
  email, 
  name, 
  role, 
  created_at,
  updated_at
FROM users 
ORDER BY created_at ASC;
