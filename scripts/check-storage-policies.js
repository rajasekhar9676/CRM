const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStoragePolicies() {
  try {
    console.log('🔄 Checking storage bucket policies...');
    
    // Try to upload a small test file
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const testPath = `test/${Date.now()}.txt`;
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(testPath, testFile);
    
    if (error) {
      console.log('❌ Upload test failed:', error.message);
      
      if (error.message?.includes('new row violates row-level security policy')) {
        console.log('');
        console.log('🔧 SOLUTION: Storage RLS policies need to be configured');
        console.log('');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to Storage → Policies');
        console.log('4. Click "New Policy" for the products bucket');
        console.log('5. Use this policy:');
        console.log('');
        console.log('Policy Name: "Allow authenticated users to upload files"');
        console.log('Target Roles: authenticated');
        console.log('Policy Definition:');
        console.log('  (bucket_id = \'products\'::text)');
        console.log('');
        console.log('6. Click "Save"');
        console.log('');
        console.log('📖 See STORAGE_POLICIES_SETUP.md for detailed steps');
        return false;
      } else {
        console.log('❌ Other error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Upload test successful!');
    
    // Clean up test file
    await supabase.storage.from('products').remove([testPath]);
    console.log('🧹 Test file cleaned up');
    
    console.log('🎉 Storage bucket is fully configured and working!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
checkStoragePolicies().then(success => {
  if (success) {
    console.log('');
    console.log('🚀 Image uploads should work perfectly in your app!');
  } else {
    console.log('');
    console.log('⚠️  Please configure storage policies first.');
  }
});
