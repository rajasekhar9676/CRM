-- Create a function to add role column if it doesn't exist
CREATE OR REPLACE FUNCTION add_role_column_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
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
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_role_column_if_not_exists() TO authenticated;
