'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Shield, AlertCircle, CheckCircle, Database, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function QuickSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "SQL script copied to clipboard.",
    });
  };

  const checkIfAdmin = async () => {
    try {
      // Check if user already has admin role
      const { data: user, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', (session?.user as any)?.id)
        .single();

      if (!error && user?.role === 'admin') {
        setSetupComplete(true);
        toast({
          title: "Already Admin",
          description: "You already have admin access!",
        });
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const makeUserAdmin = async () => {
    setLoading(true);
    try {
      // First try to add role column if it doesn't exist
      const { error: alterError } = await supabase.rpc('add_role_column_if_not_exists');
      
      // Then try to update user role
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', (session?.user as any)?.id);

      if (updateError) {
        throw updateError;
      }

      setSetupComplete(true);
      toast({
        title: "Admin Setup Complete",
        description: "You have been set up as an admin. Redirecting to admin panel...",
      });
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: "Setup Failed",
        description: "Please run the SQL script manually in Supabase first.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      checkIfAdmin();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Setup Complete!</h2>
            <p className="text-gray-600 mb-4">
              You have been set up as an admin. Redirecting to admin panel...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sqlScript = `-- Quick Admin Setup for MiniCRM
-- Run this in your Supabase SQL Editor

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Make the first user (you) an admin
UPDATE users 
SET role = 'admin' 
WHERE id = '${(session?.user as any)?.id}';

-- Verify the setup
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at ASC;`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Quick Admin Setup
          </CardTitle>
          <CardDescription>
            Set up admin access for your MiniCRM application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 1:</strong> Copy and run the SQL script below in your Supabase SQL Editor.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">SQL Script</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(sqlScript)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60">
              {sqlScript}
            </pre>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Step 2:</strong> After running the SQL script, click the button below to complete the setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Current User:</strong> {session?.user?.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>User ID:</strong> {(session?.user as any)?.id}
            </p>
          </div>

          <Button 
            onClick={makeUserAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up Admin...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Complete Admin Setup
              </>
            )}
          </Button>

          <div className="text-sm text-gray-500 text-center">
            <p>After setup, you'll be able to access:</p>
            <ul className="mt-2 space-y-1">
              <li>• User Management & Editing</li>
              <li>• Customer Management</li>
              <li>• Invoice Management</li>
              <li>• Analytics Dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
