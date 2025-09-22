import { supabase } from './supabase';

// Simple admin check that works without profiles table
export async function isSimpleAdmin(userId: string): Promise<boolean> {
  try {
    // First check if profiles table exists and user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profileError && profile?.role === 'admin') {
      return true;
    }

    // Check if user has admin role in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!userError && user?.role === 'admin') {
      return true;
    }

    // If no admin role found, check if this is the first user
    // (This is a simple fallback for initial setup)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, created_at')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!usersError && users && users.length > 0 && users[0].id === userId) {
      // This is the first user, consider them admin for setup purposes
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Create admin profile for current user
export async function createAdminProfile(userId: string, email: string, name: string): Promise<boolean> {
  try {
    // First, try to create the profiles table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('create_profiles_table_if_not_exists');
    
    // Then try to insert the admin profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        name: name,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating admin profile:', error);
      // If profiles table doesn't exist, we'll use a different approach
      return await createAdminInUsersTable(userId, email, name);
    }

    return true;
  } catch (error) {
    console.error('Error creating admin profile:', error);
    // Fallback to users table approach
    return await createAdminInUsersTable(userId, email, name);
  }
}

// Fallback: Mark user as admin in the users table
async function createAdminInUsersTable(userId: string, email: string, name: string): Promise<boolean> {
  try {
    // Add admin role to the users table
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
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
