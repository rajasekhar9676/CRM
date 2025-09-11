# Firebase Setup Guide for MiniCRM

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `minicrm` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains (localhost:3000, localhost:3001, your-domain.com)

## Step 3: Create Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location close to you
5. Click "Done"

## Step 4: Enable Storage (Optional)

1. Go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location close to you
5. Click "Done"

## Step 5: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) icon
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 6: Create Environment File

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the values with your actual Firebase configuration.

## Step 7: Deploy Firestore Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

## Step 8: Test Your Setup

1. Restart your development server: `npm run dev`
2. Open http://localhost:3000
3. Try to sign in with Google
4. Check if data is being saved to Firestore

## Security Rules

The app includes security rules in `firestore.rules` that ensure:
- Users can only access their own data
- All operations require authentication
- Data ownership is enforced

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check your `.env.local` file
   - Make sure all environment variables are set correctly
   - Restart your development server

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console
   - Go to Authentication > Settings > Authorized domains

3. **"Firebase: Error (permission-denied)"**
   - Check your Firestore security rules
   - Make sure you're authenticated

4. **PWA not working**
   - Make sure you're using HTTPS in production
   - Check that the manifest.json is accessible

## Next Steps

Once Firebase is configured:
1. Test all features (login, add customers, create orders, generate invoices)
2. Deploy to Vercel or Netlify
3. Update Firebase authorized domains with your production URL
4. Deploy Firestore security rules to production

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Check the browser console for client-side errors
3. Verify your environment variables are correct
4. Make sure all Firebase services are enabled
