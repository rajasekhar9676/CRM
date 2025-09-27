const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');
    
    // Test admin credentials
    const email = 'admin@test.com';
    const password = 'admin123';
    const name = 'Test Admin';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate UUID
    const userId = crypto.randomUUID();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log('⚠️  User already exists, updating password...');
      
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('email', email);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n📋 Test Admin Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🔗 You can now login at: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createTestAdmin();
