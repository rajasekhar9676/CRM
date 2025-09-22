import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export async function getCurrentUserProfile(userId: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // If profiles table doesn't exist or user doesn't have a profile, create one
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('Profiles table not found or user has no profile, creating default profile...');
        return await createDefaultProfile(userId);
      }
      return null;
    }

    return data as AdminUser;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function createDefaultProfile(userId: string): Promise<AdminUser | null> {
  try {
    // First, get user info from auth.users or users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    // Create a default profile with 'user' role
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data as AdminUser;
  } catch (error) {
    console.error('Error creating default profile:', error);
    return null;
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getCurrentUserProfile(userId);
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(userId: string): Promise<AdminUser> {
  const profile = await getCurrentUserProfile(userId);
  
  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return profile;
}

export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

export async function updateUserSubscription(
  userId: string, 
  plan: 'free' | 'pro' | 'business'
): Promise<boolean> {
  try {
    // First, check if user has an existing subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingSub) {
      // Update existing subscription
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          plan,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription:', error);
        return false;
      }
    } else {
      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating subscription:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
}


