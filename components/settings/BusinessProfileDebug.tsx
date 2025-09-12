'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';

export function BusinessProfileDebug() {
  const { data: session } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabaseSchema = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      // Check if business columns exist by trying to select them
      const { data, error } = await supabase
        .from('users')
        .select('business_name, business_address, business_city, business_state, business_zip, business_phone, business_email, business_website, business_tax_id, business_logo_url')
        .eq('id', (session?.user as any)?.id)
        .single();

      if (error) {
        setDebugInfo({
          error: true,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else {
        setDebugInfo({
          error: false,
          message: 'Business profile columns exist and are accessible',
          data: data
        });
      }
    } catch (error) {
      setDebugInfo({
        error: true,
        message: 'Unexpected error: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const testUpdate = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          business_name: 'Test Business',
          updated_at: new Date().toISOString(),
        })
        .eq('id', (session?.user as any)?.id);

      if (error) {
        setDebugInfo({
          error: true,
          message: 'Update failed: ' + error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else {
        setDebugInfo({
          error: false,
          message: 'Update successful! Business profile columns are working.',
        });
      }
    } catch (error) {
      setDebugInfo({
        error: true,
        message: 'Update error: ' + (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile Debug</CardTitle>
        <CardDescription>
          Debug tool to check if business profile columns exist in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={checkDatabaseSchema} disabled={loading}>
            {loading ? 'Checking...' : 'Check Database Schema'}
          </Button>
          <Button onClick={testUpdate} disabled={loading} variant="outline">
            {loading ? 'Testing...' : 'Test Update'}
          </Button>
        </div>

        {debugInfo && (
          <div className={`p-4 rounded-md ${debugInfo.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <h4 className={`font-semibold ${debugInfo.error ? 'text-red-800' : 'text-green-800'}`}>
              {debugInfo.error ? 'Error Found' : 'Success'}
            </h4>
            <p className={`text-sm mt-1 ${debugInfo.error ? 'text-red-700' : 'text-green-700'}`}>
              {debugInfo.message}
            </p>
            {debugInfo.code && (
              <p className="text-xs mt-2 text-gray-600">
                <strong>Code:</strong> {debugInfo.code}
              </p>
            )}
            {debugInfo.details && (
              <p className="text-xs mt-1 text-gray-600">
                <strong>Details:</strong> {debugInfo.details}
              </p>
            )}
            {debugInfo.hint && (
              <p className="text-xs mt-1 text-gray-600">
                <strong>Hint:</strong> {debugInfo.hint}
              </p>
            )}
            {debugInfo.data && (
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">If you see errors, run this SQL in Supabase:</h4>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`ALTER TABLE users 
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_website VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_logo_url TEXT;`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
