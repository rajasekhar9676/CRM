'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface BusinessProfile {
  business_name: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  business_tax_id: string;
  business_logo_url: string;
}

export function BusinessProfileForm() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile>({
    business_name: '',
    business_address: '',
    business_city: '',
    business_state: '',
    business_zip: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    business_tax_id: '',
    business_logo_url: '',
  });

  useEffect(() => {
    if (session?.user) {
      fetchBusinessProfile();
    }
  }, [session]);

  const fetchBusinessProfile = async () => {
    if (!(session?.user as any)?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('business_name, business_address, business_city, business_state, business_zip, business_phone, business_email, business_website, business_tax_id, business_logo_url')
        .eq('id', (session?.user as any)?.id)
        .single();

      if (error) {
        console.error('Error fetching business profile:', error);
        // If it's a column doesn't exist error, show a helpful message
        if (error.code === '42703') {
          toast({
            title: "Database Setup Required",
            description: "Business profile columns need to be added to the database. Please run the SQL commands in Supabase.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data) {
        setProfile({
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          business_city: data.business_city || '',
          business_state: data.business_state || '',
          business_zip: data.business_zip || '',
          business_phone: data.business_phone || '',
          business_email: data.business_email || '',
          business_website: data.business_website || '',
          business_tax_id: data.business_tax_id || '',
          business_logo_url: data.business_logo_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(session?.user as any)?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          business_name: profile.business_name,
          business_address: profile.business_address,
          business_city: profile.business_city,
          business_state: profile.business_state,
          business_zip: profile.business_zip,
          business_phone: profile.business_phone,
          business_email: profile.business_email,
          business_website: profile.business_website,
          business_tax_id: profile.business_tax_id,
          business_logo_url: profile.business_logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (session?.user as any)?.id);

      if (error) {
        console.error('Error updating business profile:', error);
        
        let errorMessage = "Failed to update business profile. Please try again.";
        
        if (error.code === '42703') {
          errorMessage = "Business profile columns don't exist in the database. Please run the SQL setup commands in Supabase.";
        } else if (error.code === '42501') {
          errorMessage = "Permission denied. Please check your Supabase RLS policies.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Business profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast({
        title: "Error",
        description: "Failed to update business profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading business profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Profile
        </CardTitle>
        <CardDescription>
          Update your business information for professional invoices and branding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                name="business_name"
                value={profile.business_name}
                onChange={handleChange}
                placeholder="Your Business Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <Input
                id="business_phone"
                name="business_phone"
                value={profile.business_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                name="business_email"
                value={profile.business_email}
                onChange={handleChange}
                placeholder="business@example.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_website">Website</Label>
              <Input
                id="business_website"
                name="business_website"
                value={profile.business_website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_tax_id">Tax ID / VAT Number</Label>
              <Input
                id="business_tax_id"
                name="business_tax_id"
                value={profile.business_tax_id}
                onChange={handleChange}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_logo_url">Logo URL</Label>
              <Input
                id="business_logo_url"
                name="business_logo_url"
                value={profile.business_logo_url}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <Textarea
              id="business_address"
              name="business_address"
              value={profile.business_address}
              onChange={handleChange}
              placeholder="123 Main Street, Suite 100"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_city">City</Label>
              <Input
                id="business_city"
                name="business_city"
                value={profile.business_city}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_state">State / Province</Label>
              <Input
                id="business_state"
                name="business_state"
                value={profile.business_state}
                onChange={handleChange}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_zip">ZIP / Postal Code</Label>
              <Input
                id="business_zip"
                name="business_zip"
                value={profile.business_zip}
                onChange={handleChange}
                placeholder="10001"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Business Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
