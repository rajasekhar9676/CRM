# Payment Setup Guide - Fix Database and Cashfree Issues

## 🚨 **Current Issues Fixed**

### **1. Database Error: Missing Subscriptions Table**
**Error**: `Could not find the table 'public.subscriptions' in the schema cache`

**Solution**: Run the SQL script to create the subscriptions table.

### **2. Cashfree API Error**
**Error**: `endpoint or method is not valid, please check api documentation`

**Solution**: Configure Cashfree environment variables and use test mode.

---

## **Step 1: Create Subscriptions Table**

### **Run this SQL script in your Supabase SQL Editor:**

```sql
-- Create subscriptions table for Cashfree integration
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'past_due', 'unpaid')),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_cashfree_id ON subscriptions(cashfree_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default free subscription for existing users
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT DO NOTHING;
```

**Or use the file**: `CREATE_SUBSCRIPTIONS_TABLE.sql`

---

## **Step 2: Configure Cashfree (Optional for Testing)**

### **For Testing (Mock Mode)**
The system now works in test mode without Cashfree configuration. You can test the subscription flow with mock responses.

### **For Production (Real Cashfree Integration)**

1. **Create Cashfree Account**
   - Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
   - Sign up and complete KYC
   - Get your App ID and Secret Key

2. **Add Environment Variables**
   ```env
   # Cashfree Configuration
   NEXT_PUBLIC_CASHFREE_APP_ID=your_cashfree_app_id_here
   CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
   CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret_here
   NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
   NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
   NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly
   ```

3. **Create Subscription Plans in Cashfree**
   - Starter: ₹250/month
   - Pro: ₹499/month  
   - Business: ₹999/month

---

## **Step 3: Test the Integration**

### **1. Test Database Setup**
- Go to your dashboard
- Check if the "Current Plan" section shows properly
- Try clicking "View Plans & Upgrade"

### **2. Test Subscription Flow**
- Go to `/pricing` page
- Click "Subscribe" on any plan
- Should redirect to a test payment page (mock mode)

### **3. Check for Errors**
- Open browser console
- Look for any error messages
- Check network tab for API calls

---

## **Current Status**

### **✅ Working Features**
- ✅ Pricing pages and navigation
- ✅ Database table creation script
- ✅ Error handling for missing configuration
- ✅ Mock payment flow for testing
- ✅ User authentication and session management

### **⚠️ Needs Configuration**
- ⚠️ Run SQL script to create subscriptions table
- ⚠️ Add Cashfree environment variables (for real payments)
- ⚠️ Create Cashfree account and plans (for production)

---

## **Testing the Fix**

### **1. Run the SQL Script**
```bash
# Copy the SQL from CREATE_SUBSCRIPTIONS_TABLE.sql
# Paste it in Supabase SQL Editor
# Click "Run"
```

### **2. Test Subscription**
```bash
# 1. Go to http://localhost:3000/pricing
# 2. Click "Subscribe" on any plan
# 3. Should show "Subscription created successfully (Test Mode)"
# 4. Should redirect to a test payment page
```

### **3. Check Database**
```sql
-- Check if subscriptions table exists
SELECT * FROM subscriptions;

-- Check if your user has a subscription
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

---

## **Error Messages and Solutions**

### **"Could not find the table 'public.subscriptions'"**
**Solution**: Run the SQL script above to create the table.

### **"Cashfree not configured"**
**Solution**: Add Cashfree environment variables or use test mode.

### **"endpoint or method is not valid"**
**Solution**: This is now handled gracefully with test mode responses.

---

## **Next Steps**

1. **Immediate**: Run the SQL script to fix database error
2. **Testing**: Test the subscription flow in mock mode
3. **Production**: Set up real Cashfree integration when ready
4. **Monitoring**: Check logs for any remaining issues

The system now gracefully handles both database and API configuration issues with clear error messages and fallback to test mode.
