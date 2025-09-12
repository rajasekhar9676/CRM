# Supabase + NextAuth Setup Guide for MiniCRM

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `minicrm`
5. Set a database password
6. Choose a region close to you
7. Click "Create new project"

## Step 2: Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Project API Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Step 3: Create Database Tables

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- For credentials login (nullable for Google users)
  business_name TEXT,
  phone_number TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  insta_handle TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Completed', 'Paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid')),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);
```

## Step 4: Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret

## Step 5: Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 6: Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 7: Test the Setup

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Login / Register"
4. Sign in with Google
5. You should be redirected to the dashboard

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check Google OAuth redirect URIs in Google Cloud Console
   - Make sure the URL matches exactly

2. **"Supabase connection failed"**
   - Verify your Supabase URL and API key
   - Check if your Supabase project is active

3. **"NextAuth configuration error"**
   - Verify all environment variables are set
   - Check NEXTAUTH_URL matches your domain

4. **Database permission errors**
   - Verify RLS policies are created correctly
   - Check if user is authenticated before database operations

## Next Steps

Once authentication is working:
1. Test user creation in Supabase
2. Implement CRUD operations for customers, orders, invoices
3. Add data validation and error handling
4. Deploy to production with proper environment variables

## Production Deployment

For production:
1. Update Google OAuth redirect URIs
2. Set NEXTAUTH_URL to your production domain
3. Use environment variables in your hosting platform
4. Consider using Supabase Auth for additional security features
