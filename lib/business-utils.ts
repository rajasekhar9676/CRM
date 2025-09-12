import { supabase } from './supabase';

export interface BusinessProfile {
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

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('business_name, business_address, business_city, business_state, business_zip, business_phone, business_email, business_website, business_tax_id, business_logo_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }

    return {
      business_name: data.business_name || 'Your Business Name',
      business_address: data.business_address || 'Your Business Address',
      business_city: data.business_city || 'Your City',
      business_state: data.business_state || 'Your State',
      business_zip: data.business_zip || '12345',
      business_phone: data.business_phone || '(555) 123-4567',
      business_email: data.business_email || 'your@email.com',
      business_website: data.business_website || 'https://yourwebsite.com',
      business_tax_id: data.business_tax_id || '',
      business_logo_url: data.business_logo_url || '',
    };
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }
}

export function formatBusinessAddress(profile: BusinessProfile): string {
  const parts = [
    profile.business_address,
    profile.business_city,
    profile.business_state,
    profile.business_zip
  ].filter(Boolean);
  
  return parts.join(', ');
}
