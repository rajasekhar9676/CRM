const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUpload() {
  try {
    console.log('🔄 Testing image upload to products bucket...');
    
    // Create a small test image (1x1 pixel PNG)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageData, 'base64');
    const testFile = new File([testImageBuffer], 'test.png', { type: 'image/png' });
    const testPath = `test/${Date.now()}.png`;
    
    console.log('📤 Attempting to upload test image...');
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(testPath, testFile);
    
    if (error) {
      console.log('❌ Upload failed:', error.message);
      
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
        return false;
      } else if (error.message?.includes('mime type') && error.message?.includes('not supported')) {
        console.log('');
        console.log('🔧 SOLUTION: MIME type not allowed');
        console.log('');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to Storage → Buckets');
        console.log('4. Click on the "products" bucket');
        console.log('5. Go to Settings');
        console.log('6. Add "image/png" to Allowed MIME types');
        console.log('7. Save changes');
        return false;
      } else {
        console.log('❌ Other error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Image upload successful!');
    console.log('📁 File uploaded to:', data.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);
    
    console.log('🔗 Public URL:', urlData.publicUrl);
    
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
testImageUpload().then(success => {
  if (success) {
    console.log('');
    console.log('🚀 Image uploads should work perfectly in your app!');
    console.log('💡 Try uploading an image in your product form now!');
  } else {
    console.log('');
    console.log('⚠️  Please fix the storage configuration first.');
  }
});
