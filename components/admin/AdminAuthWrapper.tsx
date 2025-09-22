'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { checkAdminStatus } from '@/lib/admin-auth-simple';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      checkAdmin();
    }
  }, [status, session, router]);

  const checkAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const adminStatus = await checkAdminStatus((session?.user as any)?.id);
      
      if (adminStatus) {
        setIsAdmin(true);
      } else {
        setError('You do not have admin access. Please contact an administrator.');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('Error checking admin access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Checking admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to User Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/admin/setup')} 
                variant="outline" 
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Setup Admin Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-4">
              You need admin privileges to access this page.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to User Dashboard
              </Button>
              <Button 
                onClick={() => router.push('/admin/setup')} 
                variant="outline" 
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Setup Admin Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
