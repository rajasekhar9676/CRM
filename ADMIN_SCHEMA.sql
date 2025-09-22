-- Admin Panel Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert existing users into profiles table (if any)
INSERT INTO profiles (id, email, name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as name,
  'user' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles p 
   JOIN subscriptions s ON p.id = s.user_id 
   WHERE s.plan = 'pro' AND s.status = 'active') as pro_subscribers,
  (SELECT COUNT(*) FROM profiles p 
   JOIN subscriptions s ON p.id = s.user_id 
   WHERE s.plan = 'business' AND s.status = 'active') as business_subscribers,
  (SELECT COUNT(*) FROM invoices 
   WHERE created_at >= date_trunc('month', CURRENT_DATE)) as invoices_this_month,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM products) as total_products;

-- Create a view for user management
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  p.created_at,
  s.plan as subscription_plan,
  s.status as subscription_status,
  s.current_period_end
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
ORDER BY p.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON admin_stats TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT ALL ON profiles TO authenticated;


