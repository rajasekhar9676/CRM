-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create admin user (replace with your preferred credentials)
INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@minicrm.com',
  'Admin User',
  'admin123',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = 'admin123',
  updated_at = NOW();

-- Verify the admin user was created
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@minicrm.com';
