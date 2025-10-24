# Storage Bucket Setup Guide

## 🚨 Issue: Product Image Upload Failing

The error you're seeing indicates that the `products` storage bucket doesn't exist in your Supabase project:

```
StorageApiError: Bucket not found
```

## 🔧 Solution: Create the Products Storage Bucket

### Option 1: Manual Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Storage**
   - Click on **Storage** in the left sidebar
   - Click on **Buckets**

3. **Create New Bucket**
   - Click **Create Bucket**
   - **Name**: `products`
   - **Public**: ✅ **Yes** (check this box)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
   - Click **Create Bucket**

### Option 2: Automated Setup (Advanced)

1. **Add Service Role Key to Environment**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (not the anon key)
   - Add it to your `.env.local` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the Setup Script**
   ```bash
   node scripts/setup-storage-bucket.js
   ```

## ✅ Verification

After creating the bucket, you should be able to:
- Upload product images without errors
- See images in the product list and detail views
- Edit products with image uploads

## 🔍 Troubleshooting

### If you still get errors:

1. **Check Bucket Permissions**
   - Ensure the bucket is set to **Public**
   - Verify the file size limit is set to 10MB or higher

2. **Check RLS Policies**
   - Go to Storage → Policies
   - Ensure there are policies allowing uploads for authenticated users

3. **Verify Environment Variables**
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Ensure they're in your `.env.local` file

### Common Error Messages:

- **"Bucket not found"** → Bucket doesn't exist (follow setup steps above)
- **"Permission denied"** → Check RLS policies in Supabase Dashboard
- **"File too large"** → Increase file size limit in bucket settings
- **"Invalid MIME type"** → Check allowed MIME types in bucket settings

## 📋 Required Bucket Settings

| Setting | Value |
|---------|-------|
| **Name** | `products` |
| **Public** | ✅ Yes |
| **File Size Limit** | `10MB` |
| **Allowed MIME Types** | `image/jpeg, image/png, image/webp, image/gif` |

## 🎯 Next Steps

Once the bucket is created:
1. Try uploading a product image again
2. The error should be resolved
3. Images will be stored at: `products/{userId}/{timestamp}.{ext}`

## 📞 Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
