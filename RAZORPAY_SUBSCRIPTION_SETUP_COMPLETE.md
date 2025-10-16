# Complete Razorpay Subscription Setup Guide

## 🎯 What Subscription Details You Need

### Required Information for Each Plan:

| Field | Description | Example |
|-------|-------------|---------|
| **Plan Name** | Display name for your plan | "Starter Plan", "Pro Plan", "Business Plan" |
| **Plan ID** | Unique identifier (you create this) | `minicrm_starter_monthly`, `minicrm_pro_monthly` |
| **Price** | Monthly cost in INR | ₹249, ₹499, ₹999 |
| **Billing Interval** | How often to charge | Monthly (1 month) |
| **Currency** | Payment currency | INR |
| **Description** | What the plan includes | "Perfect for small businesses" |

### Your Current Plans Configuration:

```typescript
// From your lib/subscription.ts
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'INR',
    description: 'Perfect for getting started',
    features: ['Up to 50 customers', '20 invoices per month', 'Basic dashboard', 'Email support'],
    limits: { maxCustomers: 50, maxInvoicesPerMonth: 20, hasProductManagement: false, hasWhatsAppCRM: false, hasPrioritySupport: false }
  },
  starter: {
    name: 'Starter',
    price: 249,
    currency: 'INR',
    description: 'Perfect for small businesses',
    features: ['Up to 200 customers', '100 invoices per month', 'Basic product management', 'Email support', 'Basic analytics'],
    limits: { maxCustomers: 200, maxInvoicesPerMonth: 100, hasProductManagement: true, hasWhatsAppCRM: false, hasPrioritySupport: false }
  },
  pro: {
    name: 'Pro',
    price: 499,
    currency: 'INR',
    description: 'For growing businesses',
    features: ['Unlimited customers', 'Unlimited invoices', 'Advanced product management', 'Advanced analytics', 'Priority email support', 'WhatsApp integration'],
    limits: { maxCustomers: -1, maxInvoicesPerMonth: -1, hasProductManagement: true, hasWhatsAppCRM: true, hasPrioritySupport: false }
  },
  business: {
    name: 'Business',
    price: 999,
    currency: 'INR',
    description: 'Complete business solution',
    features: ['Everything in Pro', 'Advanced WhatsApp CRM', 'Priority phone support', 'Advanced automation', 'Custom integrations', 'Dedicated account manager'],
    limits: { maxCustomers: -1, maxInvoicesPerMonth: -1, hasProductManagement: true, hasWhatsAppCRM: true, hasPrioritySupport: true }
  }
};
```

---

## 🚀 Step-by-Step Razorpay Setup

### Step 1: Create Razorpay Account

1. **Go to**: https://razorpay.com
2. **Click**: "Sign Up" 
3. **Fill details**: Name, email, phone, business details
4. **Complete KYC**: Upload required documents (for live mode)
5. **Verify email**: Check your email and verify

### Step 2: Get API Keys

1. **Login** to Razorpay Dashboard
2. **Go to**: Settings → API Keys
3. **Click**: "Generate Test Key" (for testing)
4. **Copy both keys**:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxx` (keep this secret!)

### Step 3: Create Subscription Plans in Razorpay

#### Plan 1: Starter Plan (₹249/month)

1. **Go to**: Subscriptions → Plans
2. **Click**: "Create New Plan"
3. **Fill details**:
   ```
   Plan Name: MiniCRM Starter Plan
   Plan ID: minicrm_starter_monthly
   Billing Interval: Monthly (1 month)
   Billing Amount: ₹249.00
   Currency: INR
   Description: Perfect for small businesses with up to 200 customers
   ```
4. **Click**: "Create Plan"
5. **Copy the Plan ID**: `plan_xxxxxxxxxxxxx`

#### Plan 2: Pro Plan (₹499/month)

1. **Click**: "Create New Plan"
2. **Fill details**:
   ```
   Plan Name: MiniCRM Pro Plan
   Plan ID: minicrm_pro_monthly
   Billing Interval: Monthly (1 month)
   Billing Amount: ₹499.00
   Currency: INR
   Description: For growing businesses with unlimited customers
   ```
3. **Click**: "Create Plan"
4. **Copy the Plan ID**: `plan_xxxxxxxxxxxxx`

#### Plan 3: Business Plan (₹999/month)

1. **Click**: "Create New Plan"
2. **Fill details**:
   ```
   Plan Name: MiniCRM Business Plan
   Plan ID: minicrm_business_monthly
   Billing Interval: Monthly (1 month)
   Billing Amount: ₹999.00
   Currency: INR
   Description: Complete business solution with all features
   ```
3. **Click**: "Create Plan"
4. **Copy the Plan ID**: `plan_xxxxxxxxxxxxx`

### Step 4: Set Up Webhook

1. **Go to**: Settings → Webhooks
2. **Click**: "Add New Webhook"
3. **Fill details**:
   ```
   Webhook URL: https://yourdomain.com/api/razorpay/webhook
   Alert Email: your-email@example.com
   Secret: Generate Secret (or create your own)
   ```
4. **Select Events**:
   - ✅ subscription.activated
   - ✅ subscription.charged
   - ✅ subscription.completed
   - ✅ subscription.cancelled
   - ✅ subscription.paused
   - ✅ subscription.resumed
   - ✅ subscription.pending
   - ✅ subscription.halted
   - ✅ payment.failed
5. **Click**: "Create Webhook"
6. **Copy the Webhook Secret**: `whsec_xxxxxxxxxxxxx`

### Step 5: Update Environment Variables

Create/update your `.env.local` file:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Razorpay Plan IDs (from Step 3)
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=plan_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=plan_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=plan_xxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Test Your Setup

1. **Start your app**: `npm run dev`
2. **Go to**: http://localhost:3000/pricing
3. **Click**: "Subscribe to Starter" (or any plan)
4. **Test payment** with Razorpay test cards:
   - **Card**: 4111 1111 1111 1111
   - **CVV**: 123
   - **Expiry**: 12/25
   - **Name**: Any name

---

## 📊 Database Schema Required

Your database needs these tables and columns:

### Subscriptions Table:
```sql
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
```

### Users Table (add business profile columns):
```sql
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

---

## 🔄 How Subscription Flow Works

### 1. User Subscribes
```
User clicks "Subscribe" → 
API creates Razorpay subscription → 
User redirected to Razorpay payment page → 
User pays → 
Razorpay sends webhook → 
Database updated with subscription details
```

### 2. Subscription Management
```
User can view current plan → 
See usage limits → 
Cancel subscription → 
Upgrade/downgrade (by canceling and resubscribing)
```

### 3. Feature Gating
```
App checks user's plan → 
Enforces limits (customers, invoices) → 
Shows/hides features based on plan → 
Displays upgrade prompts when limits reached
```

---

## 💰 Pricing Strategy Recommendations

### Free Plan (₹0)
- **Target**: New users, testing
- **Limits**: 50 customers, 20 invoices/month
- **Goal**: Convert to paid plans

### Starter Plan (₹249/month)
- **Target**: Small businesses, freelancers
- **Limits**: 200 customers, 100 invoices/month
- **Features**: Basic product management

### Pro Plan (₹499/month)
- **Target**: Growing businesses
- **Limits**: Unlimited customers and invoices
- **Features**: Advanced analytics, WhatsApp integration

### Business Plan (₹999/month)
- **Target**: Established businesses
- **Limits**: Everything unlimited
- **Features**: Priority support, advanced automation

---

## 🧪 Testing Checklist

### Before Going Live:

- [ ] **Razorpay Account**: Created and verified
- [ ] **API Keys**: Generated and added to environment
- [ ] **Plans Created**: All 3 plans in Razorpay Dashboard
- [ ] **Webhook Setup**: URL configured and secret added
- [ ] **Database**: Tables created with correct schema
- [ ] **Test Payments**: All plans tested with test cards
- [ ] **Webhook Events**: Verify events are received
- [ ] **Feature Gating**: Test limits and restrictions
- [ ] **Subscription Management**: Test cancel/upgrade flows

### Test Cards (Razorpay Test Mode):

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | 123 | 12/25 | Success |
| 4000 0000 0000 0002 | 123 | 12/25 | Declined |
| 4000 0000 0000 9995 | 123 | 12/25 | Insufficient Funds |

---

## 🚀 Going Live (Production)

### 1. Complete KYC
- Upload all required documents
- Wait for approval (24-48 hours)

### 2. Switch to Live Mode
- Toggle to "Live Mode" in Razorpay Dashboard
- Generate new Live API Keys
- Create plans in Live Mode (same process)

### 3. Update Environment Variables
```env
# Live Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret

# Live Plan IDs
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=plan_live_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=plan_live_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=plan_live_xxxxxxxxxxxxx

# Production URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Deploy and Test
- Deploy your application
- Test with real payment methods
- Monitor webhook events
- Set up monitoring and alerts

---

## 📈 Revenue Tracking

### Key Metrics to Track:
- **Monthly Recurring Revenue (MRR)**
- **Customer Acquisition Cost (CAC)**
- **Churn Rate** (customers leaving)
- **Average Revenue Per User (ARPU)**
- **Plan Distribution** (which plans are popular)

### Razorpay Dashboard Provides:
- Real-time payment data
- Subscription analytics
- Refund tracking
- Settlement reports

---

## 🆘 Troubleshooting

### Common Issues:

1. **"Razorpay not configured" error**
   - Check environment variables are set
   - Restart development server
   - Verify variable names are correct

2. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check server logs for errors

3. **Payment page not loading**
   - Verify Key ID is correct
   - Check browser console for errors
   - Ensure you're in correct mode (test/live)

4. **Database errors**
   - Run database setup scripts
   - Check table structure
   - Verify RLS policies

---

## 📞 Support Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **Test Cards**: https://razorpay.com/docs/payments/test-card-details/

---

## ✅ Quick Start Summary

1. **Create Razorpay account** ✅
2. **Get API keys** ✅
3. **Create 3 subscription plans** ✅
4. **Set up webhook** ✅
5. **Add environment variables** ✅
6. **Test with test cards** ✅
7. **Deploy to production** ✅

Your subscription system is now ready to generate revenue! 🚀
