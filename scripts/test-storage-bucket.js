const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageBucket() {
  try {
    console.log('🔄 Testing products storage bucket...');
    
    // Try to list files in the products bucket
    const { data, error } = await supabase.storage
      .from('products')
      .list('', { limit: 1 });
    
    if (error) {
      if (error.message?.includes('Bucket not found') || error.message?.includes('400')) {
        console.log('❌ Products bucket does not exist!');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Click "Storage" → "Buckets"');
        console.log('4. Click "Create Bucket"');
        console.log('5. Name: "products", Public: ✅ Yes');
        console.log('6. File size: 10MB, MIME types: image/jpeg, image/png, image/webp, image/gif');
        console.log('7. Click "Create Bucket"');
        console.log('');
        console.log('📖 See CREATE_STORAGE_BUCKET_NOW.md for detailed steps');
        return false;
      } else {
        console.error('❌ Error accessing bucket:', error.message);
        return false;
      }
    }
    
    console.log('✅ Products bucket exists and is accessible!');
    console.log('🎉 Image uploads should work in your app.');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testStorageBucket().then(success => {
  if (success) {
    console.log('');
    console.log('🚀 You can now test image uploads in your app!');
  } else {
    console.log('');
    console.log('⚠️  Please create the storage bucket first, then run this test again.');
  }
});
