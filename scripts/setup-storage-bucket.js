const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  console.error('You can find it in your Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProductsBucket() {
  try {
    console.log('🔄 Checking if products bucket exists...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const productsBucket = buckets.find(bucket => bucket.name === 'products');
    
    if (productsBucket) {
      console.log('✅ Products bucket already exists!');
      return;
    }
    
    console.log('🔄 Creating products bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('products', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }
    
    console.log('✅ Products bucket created successfully!');
    console.log('📋 Bucket details:');
    console.log('   - Name: products');
    console.log('   - Public: true');
    console.log('   - File size limit: 10MB');
    console.log('   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createProductsBucket();
