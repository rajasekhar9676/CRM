const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate dummy admin credentials
const adminEmail = 'admin@minicrm.com';
const adminPassword = 'admin123';
const adminName = 'Admin User';
const adminId = crypto.randomUUID();

async function setupAdmin() {
  try {
    console.log('🚀 Setting up admin credentials...');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', adminName);
    console.log('🆔 ID:', adminId);
    console.log('');

    // First, add role column if it doesn't exist
    console.log('1️⃣ Adding role column to users table...');
    const { error: alterError } = await supabase.rpc('add_role_column_if_not_exists');
    
    if (alterError) {
      console.log('⚠️  Role column might already exist, continuing...');
    } else {
      console.log('✅ Role column added successfully');
    }

    // Check if admin user already exists
    console.log('2️⃣ Checking if admin user exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingUser) {
      console.log('👤 Admin user already exists, updating role...');
      
      // Update existing user to admin
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          password: adminPassword, // Update password
          updated_at: new Date().toISOString()
        })
        .eq('email', adminEmail);

      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: adminId,
          email: adminEmail,
          name: adminName,
          password: adminPassword,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
      
      console.log('✅ Admin user created successfully');
    }

    console.log('');
    console.log('🎉 Admin setup completed successfully!');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Email: admin@minicrm.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3001/auth/signin');
    console.log('   Or go directly to: http://localhost:3001/admin');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    console.log('');
    console.log('🔧 Manual Setup:');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Run this SQL:');
    console.log('');
    console.log(`-- Add role column
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create admin user
INSERT INTO users (id, email, name, password, role, created_at, updated_at)
VALUES ('${adminId}', '${adminEmail}', '${adminName}', '${adminPassword}', 'admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  password = '${adminPassword}',
  updated_at = NOW();`);
  }
}

// Run the setup
setupAdmin();
