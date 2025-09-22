import { supabase } from './supabase';

// Simple admin authentication that works independently
export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in users table
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Make user admin
export async function makeUserAdmin(userId: string): Promise<boolean> {
  try {
    // First, ensure role column exists
    const { error: alterError } = await supabase.rpc('add_role_column_if_not_exists');
    
    // Then update user to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error making user admin:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}

// Get all users for admin panel
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Update user information
export async function updateUser(userId: string, updates: { email?: string; name?: string; role?: string }) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}
