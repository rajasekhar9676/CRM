'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Database, CheckCircle, AlertCircle, User, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function VerifySetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/admin-signin?callbackUrl=/admin/verify-setup');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      checkAdminSetup();
    }
  }, [status, session, router]);

  const checkAdminSetup = async () => {
    try {
      setLoading(true);
      setSetupError('');

      // Check if admin user exists
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@minicrm.com')
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        throw adminError;
      }

      if (adminData) {
        setAdminExists(true);
        setAdminUser(adminData);
      } else {
        setAdminExists(false);
      }
    } catch (error) {
      console.error('Error checking admin setup:', error);
      setSetupError('Failed to check admin setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    try {
      setLoading(true);
      setSetupError('');

      // First, try to add role column if it doesn't exist
      const { error: alterError } = await supabase.rpc('add_role_column_if_not_exists');
      
      // Create admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: 'admin@minicrm.com',
          name: 'Admin User',
          password: 'admin123',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Admin User Created!",
        description: "Admin credentials have been set up successfully.",
      });

      // Refresh the check
      await checkAdminSetup();
    } catch (error) {
      console.error('Error creating admin user:', error);
      setSetupError('Failed to create admin user. Please run the SQL script manually.');
    } finally {
      setLoading(false);
    }
  };

  const copySqlScript = () => {
    const sqlScript = `-- Admin Setup for MiniCRM
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 3: Create admin user
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

-- Step 4: Verify the admin user was created
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@minicrm.com';`;

    navigator.clipboard.writeText(sqlScript);
    toast({
      title: "SQL Copied!",
      description: "SQL script copied to clipboard. Run it in Supabase SQL Editor.",
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking admin setup...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Admin Setup Verification
          </CardTitle>
          <CardDescription>
            Check and set up admin credentials in your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{setupError}</AlertDescription>
            </Alert>
          )}

          {adminExists ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <strong className="text-green-800">Admin User Found!</strong>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Admin credentials are set up in your database.
              </p>
              {adminUser && (
                <div className="bg-white p-3 rounded border">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span className="text-gray-700">{adminUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Name:</span>
                      <span className="text-gray-700">{adminUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Role:</span>
                      <span className="text-gray-700">{adminUser.role}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => router.push('/auth/admin-signin')}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Admin Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="w-full"
                >
                  Go to Admin Panel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <strong className="text-yellow-800">Admin User Not Found</strong>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Admin credentials are not set up in your database. Choose one of the options below:
              </p>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">Option 1: Automatic Setup</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Try to create the admin user automatically (may require proper permissions).
                  </p>
                  <Button
                    onClick={createAdminUser}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Admin User...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Create Admin User
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">Option 2: Manual SQL Setup</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Copy and run the SQL script in your Supabase SQL Editor.
                  </p>
                  <Button
                    onClick={copySqlScript}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Copy SQL Script
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <strong className="text-gray-800">Admin Credentials</strong>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Email:</strong> admin@minicrm.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={checkAdminSetup}
              variant="outline"
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Refresh Check
            </Button>
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              className="flex-1"
            >
              Back to Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
