# Subscription Flow Diagram

## 🔄 Complete Subscription Process

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Clicks   │───▶│  API Creates     │───▶│  Razorpay       │
│   "Subscribe"   │    │  Subscription    │    │  Payment Page   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Database        │    │  User Pays      │
                       │  Stores Plan     │    │  with Card/UPI  │
                       │  Details         │    └─────────────────┘
                       └──────────────────┘            │
                                │                      ▼
                                │              ┌─────────────────┐
                                │              │  Razorpay       │
                                │              │  Sends Webhook  │
                                │              └─────────────────┘
                                │                      │
                                ▼                      ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  App Updates     │◀───│  Webhook        │
                       │  Subscription    │    │  Handler        │
                       │  Status          │    │  Processes      │
                       └──────────────────┘    │  Payment        │
                                               └─────────────────┘
```

## 📊 Plan Details Required

### Your 4 Subscription Plans:

```
┌─────────────┬─────────┬─────────┬─────────┬─────────┐
│   Feature   │  Free   │ Starter │   Pro   │Business │
├─────────────┼─────────┼─────────┼─────────┼─────────┤
│ Price       │   ₹0    │  ₹249   │  ₹499   │  ₹999   │
│ Customers   │   50    │   200   │Unlimited│Unlimited│
│ Invoices    │   20    │   100   │Unlimited│Unlimited│
│ Products    │   ❌    │    ✅   │    ✅   │    ✅   │
│ WhatsApp    │   ❌    │    ❌   │    ✅   │    ✅   │
│ Priority    │   ❌    │    ❌   │    ❌   │    ✅   │
└─────────────┴─────────┴─────────┴─────────┴─────────┘
```

## 🛠️ Razorpay Setup Steps:

### Step 1: Create Account
```
1. Go to razorpay.com
2. Sign up with business details
3. Complete KYC verification
4. Get approved (24-48 hours)
```

### Step 2: Get API Keys
```
1. Login to Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate Test Key
4. Copy Key ID and Secret
```

### Step 3: Create Plans
```
For each plan (Starter, Pro, Business):
1. Go to Subscriptions → Plans
2. Click "Create New Plan"
3. Fill plan details:
   - Plan Name: "MiniCRM Starter Plan"
   - Plan ID: "minicrm_starter_monthly"
   - Amount: ₹249.00
   - Interval: Monthly
4. Save and copy Plan ID
```

### Step 4: Setup Webhook
```
1. Go to Settings → Webhooks
2. Add webhook URL: https://yourdomain.com/api/razorpay/webhook
3. Select events: subscription.activated, subscription.charged, etc.
4. Generate webhook secret
5. Copy webhook secret
```

### Step 5: Environment Variables
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=plan_xxxxx
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=plan_xxxxx
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=plan_xxxxx
```

## 🧪 Testing Process:

```
1. Start app: npm run dev
2. Go to /pricing page
3. Click "Subscribe to Starter"
4. Use test card: 4111 1111 1111 1111
5. Complete payment
6. Check database for subscription
7. Verify webhook events received
```

## 💰 Revenue Flow:

```
User subscribes → Monthly payment → Razorpay processes → 
Money goes to your bank account (minus 2% fee) → 
You get recurring revenue every month
```

## 🔧 Database Schema:

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan TEXT CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'created', 'pending')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN,
  razorpay_subscription_id VARCHAR(255),
  razorpay_customer_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Business profile columns for users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_website VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_logo_url TEXT;
```

## 🎯 What You Need to Do:

### Immediate Actions:
1. ✅ **WhatsApp icon fixed** - Now shows proper WhatsApp logo
2. ✅ **Subscription system ready** - All code implemented
3. ✅ **Database schema ready** - SQL scripts provided
4. ✅ **Documentation complete** - Step-by-step guides

### Next Steps:
1. **Create Razorpay account** (5 minutes)
2. **Get API keys** (2 minutes)
3. **Create 3 subscription plans** (10 minutes)
4. **Set up webhook** (5 minutes)
5. **Add environment variables** (2 minutes)
6. **Test with test cards** (5 minutes)
7. **Deploy to production** (when ready)

## 📈 Expected Results:

- **Free users** can try your app with limits
- **Paid users** get unlimited access to features
- **Recurring revenue** every month
- **Scalable business model** that grows with your users

## 🚀 Success Metrics:

- **MRR (Monthly Recurring Revenue)**: Track monthly income
- **Conversion Rate**: Free to paid users
- **Churn Rate**: Users leaving per month
- **ARPU (Average Revenue Per User)**: Revenue per customer

Your subscription system is 100% ready - just need to set up Razorpay! 🎉
