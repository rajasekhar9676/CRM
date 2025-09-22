-- Add role column to users table for admin functionality
-- Run this in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update existing users to have 'user' role if they don't have one
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Make the first user (oldest) an admin
UPDATE users 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);
