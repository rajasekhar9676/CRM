'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function SimpleAdminSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
  }, [status, router]);

  const addRoleColumn = async () => {
    try {
      // Try to add role column to users table
      const { error } = await supabase.rpc('add_role_column_to_users');
      
      if (error) {
        console.log('RPC function not available, trying direct approach...');
        // If RPC doesn't work, we'll handle it in the next step
        return { success: true, needsManualSetup: true };
      }
      
      return { success: true, needsManualSetup: false };
    } catch (error) {
      console.log('Error adding role column:', error);
      return { success: true, needsManualSetup: true };
    }
  };

  const makeUserAdmin = async () => {
    try {
      // Try to update user role directly
      const { error } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', (session?.user as any)?.id);

      if (error) {
        console.error('Error updating user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  const setupAdmin = async () => {
    setLoading(true);
    try {
      // Step 1: Add role column (if needed)
      if (step === 1) {
        const result = await addRoleColumn();
        if (result.success) {
          if (result.needsManualSetup) {
            setStep(2);
            toast({
              title: "Manual Setup Required",
              description: "Please run the SQL script in Supabase to add the role column.",
            });
          } else {
            setStep(3);
            toast({
              title: "Role Column Added",
              description: "Successfully added role column to users table.",
            });
          }
        } else {
          throw new Error('Failed to add role column');
        }
        return;
      }

      // Step 2: Manual setup instructions
      if (step === 2) {
        setStep(3);
        return;
      }

      // Step 3: Make user admin
      if (step === 3) {
        const success = await makeUserAdmin();
        if (success) {
          setSetupComplete(true);
          toast({
            title: "Admin Setup Complete",
            description: "You have been set up as an admin. You can now access the admin panel.",
          });
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        } else {
          throw new Error('Failed to make user admin');
        }
      }
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to set up admin access. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Simple Admin Setup
          </CardTitle>
          <CardDescription>
            Set up admin access using your existing users table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Step 1: Adding role column to users table...
                </AlertDescription>
              </Alert>
              <Button onClick={setupAdmin} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Role Column...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Add Role Column
                  </>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Manual Setup Required:</strong><br />
                  Please run this SQL in your Supabase SQL Editor:
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));`}
                  </pre>
                </AlertDescription>
              </Alert>
              <Button onClick={setupAdmin} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                I've Run the SQL - Continue
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Step 3: Making your account an admin...
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
              <Button onClick={setupAdmin} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Making Admin...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Make Me Admin
                  </>
                )}
              </Button>
            </>
          )}

          <div className="text-sm text-gray-500 text-center">
            <p>After setup, you'll be able to access:</p>
            <ul className="mt-2 space-y-1">
              <li>• User Management</li>
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
