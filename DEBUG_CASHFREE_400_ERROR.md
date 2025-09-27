# Debugging Cashfree 400 Error

## 🔍 **Issue Analysis**

The 400 Bad Request error is likely caused by one of these issues:

### **1. Missing Environment Variables**
- `NEXT_PUBLIC_CASHFREE_APP_ID` not set
- `CASHFREE_SECRET_KEY` not set
- `NEXT_PUBLIC_APP_URL` not set

### **2. Invalid Plan Selection**
- Plan not in allowed list: `['starter', 'pro', 'business']`
- Plan configuration missing

### **3. User Authentication Issues**
- Session not found
- User not found in database

### **4. Database Issues**
- `subscriptions` table doesn't exist
- User table query fails

## 🛠️ **Debugging Steps**

### **Step 1: Check Environment Variables**

Create or update your `.env.local` file:

```env
# Cashfree Configuration (for testing)
NEXT_PUBLIC_CASHFREE_APP_ID=test_app_id
CASHFREE_SECRET_KEY=test_secret_key
CASHFREE_WEBHOOK_SECRET=test_webhook_secret

# Plan IDs
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 2: Check Console Logs**

The API route now has detailed logging. Check your browser console and server logs for:

```
🔍 Starting subscription creation...
🔍 Session: Found/Not found
🔍 Request body: { plan: "starter" }
🔍 Fetching user from database...
🔍 User query result: { user: {...}, userError: null }
🔍 Checking Cashfree environment variables...
🔍 Cashfree App ID: Set/Not set
🔍 Cashfree Secret Key: Set/Not set
🔍 Selected plan config: { name: "Starter Plan", ... }
```

### **Step 3: Test the API Directly**

Use curl or Postman to test:

```bash
curl -X POST http://localhost:3000/api/cashfree/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"plan": "starter"}' \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### **Step 4: Check Database**

Ensure the `subscriptions` table exists:

```sql
-- Run this in Supabase SQL Editor
SELECT * FROM subscriptions LIMIT 1;
```

If table doesn't exist, run:
```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'pending',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    cashfree_subscription_id TEXT,
    cashfree_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 **Quick Fix**

### **Option 1: Test Mode (No Cashfree Required)**

The API will work in test mode if you don't have Cashfree credentials:

```env
# Add these to .env.local for testing
NEXT_PUBLIC_CASHFREE_APP_ID=test
CASHFREE_SECRET_KEY=test
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Option 2: Mock Response**

If you want to test without Cashfree, the API will return a mock response when credentials are missing.

## 🔧 **Common Solutions**

### **1. Environment Variables Not Loading**
- Restart the development server after adding `.env.local`
- Check file is in project root
- Ensure no spaces around `=`

### **2. Session Issues**
- Make sure you're logged in
- Check NextAuth configuration
- Verify session token in browser

### **3. Database Connection**
- Check Supabase connection
- Verify table exists
- Check RLS policies

### **4. Plan Validation**
- Ensure plan is exactly: `starter`, `pro`, or `business`
- Check plan configuration object

## 📋 **Checklist**

- [ ] Environment variables set in `.env.local`
- [ ] Development server restarted
- [ ] User logged in
- [ ] `subscriptions` table exists
- [ ] Plan name is correct
- [ ] Console logs show detailed error
- [ ] Network tab shows request/response

## 🆘 **Still Getting 400?**

1. **Check browser console** for detailed error logs
2. **Check server logs** in terminal
3. **Test with curl** to isolate the issue
4. **Verify all environment variables** are set
5. **Check database connection** and table existence

The enhanced logging will show exactly where the 400 error is coming from!
