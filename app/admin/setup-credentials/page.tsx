'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Database, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupCredentialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const adminCredentials = {
    email: 'admin@minicrm.com',
    password: 'admin123',
    name: 'Admin User'
  };

  const sqlScript = `-- Admin Setup for BizMitra
-- Run this in your Supabase SQL Editor

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 3: Create admin user
INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '${adminCredentials.email}',
  '${adminCredentials.name}',
  '${adminCredentials.password}',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = '${adminCredentials.password}',
  updated_at = NOW();

-- Step 4: Verify the admin user was created
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = '${adminCredentials.email}';`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "SQL script copied to clipboard.",
    });
  };

  const copyCredentials = () => {
    const credentials = `Email: ${adminCredentials.email}\nPassword: ${adminCredentials.password}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Credentials Copied!",
      description: "Admin credentials copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Admin Credentials Setup
          </CardTitle>
          <CardDescription>
            Set up admin credentials for your BizMitra application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Admin Credentials */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <strong className="text-green-800">Admin Credentials</strong>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Use these credentials to login to the admin panel:
            </p>
            <div className="bg-white p-3 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={adminCredentials.email}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(adminCredentials.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={adminCredentials.password}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(adminCredentials.password)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  onClick={copyCredentials}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Credentials
                </Button>
              </div>
            </div>
          </div>

          {/* SQL Setup */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-yellow-600" />
              <strong className="text-yellow-800">Step 1: Run SQL Script</strong>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              Copy and run the SQL script below in your Supabase SQL Editor to create the admin user.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">SQL Script</label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(sqlScript)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy SQL
                </Button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
                {sqlScript}
              </pre>
            </div>
          </div>

          {/* Login Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <strong className="text-blue-800">Step 2: Login to Admin Panel</strong>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              After running the SQL script, you can login to the admin panel using the credentials above.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Go to Login Page
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

          {/* Quick Test */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <strong className="text-gray-800">Quick Test</strong>
            </div>
            <p className="text-gray-700 text-sm">
              After setup, you can test the login by going to{' '}
              <code className="bg-gray-200 px-1 rounded">http://localhost:3001/auth/signin</code>
              {' '}and using the credentials above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
