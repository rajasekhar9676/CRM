-- Create SQL functions for admin setup
-- Run this in your Supabase SQL Editor

-- Function to add role column if it doesn't exist
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

-- Function to make a user admin
CREATE OR REPLACE FUNCTION make_user_admin(user_id UUID)
RETURNS boolean AS $$
BEGIN
  -- First ensure role column exists
  PERFORM add_role_column_if_not_exists();
  
  -- Update user to admin
  UPDATE users 
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_role_column_if_not_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION make_user_admin(UUID) TO authenticated;
