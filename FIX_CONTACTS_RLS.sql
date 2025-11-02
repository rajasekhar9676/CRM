-- Fix RLS policies for contacts table if admin access is blocked
-- Run this if contacts are being saved but not visible in admin panel

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Admins can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON contacts;

-- Recreate with better logic
-- Policy: Allow admins to view all contacts
CREATE POLICY "Admins can view all contacts"
  ON contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Policy: Allow admins to update contacts
CREATE POLICY "Admins can update contacts"
  ON contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'admin'
    )
  );

-- Alternative: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later:
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;


