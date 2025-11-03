# 🎯 Razorpay Implementation - Complete Procedure

## Overview
Your MiniCRM application now has **Razorpay** payment integration instead of Cashfree. This document provides the complete procedure to make it workable.

---

## 📋 What Has Been Done

### ✅ Code Implementation (Completed)

1. **Installed Razorpay SDK**
   ```bash
   npm install razorpay
   ```

2. **Created Core Files:**
   - `lib/razorpay.ts` - Razorpay library with all helper functions
   - `app/api/razorpay/create-subscription/route.ts` - Create subscriptions
   - `app/api/razorpay/webhook/route.ts` - Handle webhook events
   - `app/api/razorpay/cancel-subscription/route.ts` - Cancel subscriptions

3. **Updated Existing Files:**
   - `lib/subscription.ts` - Added Razorpay plan IDs
   - `components/pricing/PricingSection.tsx` - Uses Razorpay API now
   - `components/settings/SubscriptionManagement.tsx` - Supports Razorpay
   - `types/index.ts` - Added Razorpay types
   - `env.example` - Added Razorpay environment variables
   - `app/pricing/page.tsx` - Updated payment methods info

4. **Created Documentation:**
   - `RAZORPAY_SETUP.md` - Comprehensive setup guide (⭐ READ THIS)
   - `RAZORPAY_QUICK_START.md` - 5-step quick start guide
   - `RAZORPAY_IMPLEMENTATION_SUMMARY.md` - Technical details
   - `RAZORPAY_DATABASE_SETUP.sql` - Database migration script
   - `README_RAZORPAY.md` - This file

---

## 🚀 What You Need To Do (Step by Step)

### STEP 1: Create Razorpay Account (10 minutes)

**Actions:**
1. Visit https://razorpay.com
2. Click "Sign Up" and create your account
3. Complete email verification
4. Fill in your business details

**What you get:**
- Razorpay Dashboard access
- Test mode enabled by default

---

### STEP 2: Get API Keys (2 minutes)

**Actions:**
1. Log in to Razorpay Dashboard
2. Go to **Settings** (left sidebar) → **API Keys**
3. Click **"Generate Test Key"**
4. You'll see:
   - **Key ID** (e.g., `rzp_test_xxxxxxxxxxxxx`)
   - **Key Secret** (click to reveal)
5. **IMPORTANT**: Copy and save both keys securely!

**Screenshot locations:**
- Key ID: Shows immediately
- Key Secret: Click the eye icon to reveal

---

### STEP 3: Create Subscription Plans (15 minutes)

**Actions:**
1. In Razorpay Dashboard, go to **Subscriptions** → **Plans**
2. Click **"+ Create New Plan"**

**Create Plan 1 - Starter:**
```
Plan Name: Starter Plan
Plan ID: minicrm_starter_monthly
Billing Interval: Monthly (1 month)
Billing Amount: 249.00
Currency: INR
Description: Perfect for small businesses
```
Click **Create Plan** → **Save the Plan ID**

**Create Plan 2 - Pro:**
```
Plan Name: Pro Plan
Plan ID: minicrm_pro_monthly
Billing Interval: Monthly (1 month)
Billing Amount: 499.00
Currency: INR
Description: For growing businesses
```
Click **Create Plan** → **Save the Plan ID**

**Create Plan 3 - Business:**
```
Plan Name: Business Plan
Plan ID: minicrm_business_monthly
Billing Interval: Monthly (1 month)
Billing Amount: 999.00
Currency: INR
Description: Complete business solution
```
Click **Create Plan** → **Save the Plan ID**

**⚠️ IMPORTANT**: The Plan IDs must match exactly! Or update them in the next step.

---

### STEP 4: Configure Environment Variables (3 minutes)

**Actions:**
1. Open your project folder
2. Create or edit `.env.local` file in the root directory
3. Add these variables:

```env
# Razorpay API Keys (from Step 2)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=razorpay_webhook_secret_123

# Razorpay Plan IDs (from Step 3)
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=minicrm_business_monthly

# Your Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace:**
- `rzp_test_xxxxxxxxxxxxx` → Your actual Key ID from Step 2
- `your_key_secret_here` → Your actual Key Secret from Step 2
- `razorpay_webhook_secret_123` → Any secret string (we'll update this in Step 6)
- Plan IDs → Your actual Plan IDs from Step 3 (if different)

**⚠️ Security:**
- NEVER commit `.env.local` to Git
- Keep your Key Secret confidential

---

### STEP 5: Update Database (2 minutes)

**Actions:**
1. Open Supabase Dashboard (https://supabase.com)
2. Go to your project
3. Click **SQL Editor** in left sidebar
4. Click **"New Query"**
5. Copy and paste this SQL:

```sql
-- Add Razorpay columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_razorpay_subscription_id 
ON subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_customer_id 
ON subscriptions(razorpay_customer_id);
```

6. Click **"Run"** or press Ctrl+Enter
7. You should see "Success" message

**Alternative:**
Run the `RAZORPAY_DATABASE_SETUP.sql` file provided in your project.

---

### STEP 6: Configure Webhooks (5 minutes)

Webhooks let Razorpay notify your app about payment events.

#### For Local Development (Testing):

**Actions:**
1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start your Next.js app in one terminal:
   ```bash
   npm run dev
   ```

3. In another terminal, run ngrok:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

5. Go to Razorpay Dashboard → **Settings** → **Webhooks**

6. Click **"+ Add New Webhook"**

7. Fill in:
   ```
   Webhook URL: https://abc123.ngrok.io/api/razorpay/webhook
   Alert Email: your-email@example.com
   Active Events: Select ALL subscription and payment events
   ```

8. Click **"Create Webhook"**

9. Click on the created webhook → Click **"Generate Secret"**

10. Copy the webhook secret

11. Update your `.env.local`:
    ```env
    RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
    ```

12. **Restart your Next.js app** to load new environment variable

#### For Production:

**Actions:**
1. Deploy your application first
2. Use your production URL: `https://yourdomain.com/api/razorpay/webhook`
3. Follow same steps as above with production URL
4. Use production webhook secret in production environment

---

### STEP 7: Test the Integration (10 minutes)

**Actions:**

1. **Start your application:**
   ```bash
   npm run dev
   ```
   App should start at http://localhost:3000

2. **Log in to your application**

3. **Go to Pricing page** (usually at `/pricing`)

4. **Click "Subscribe to Starter"** (or any plan)

5. **You should be redirected to Razorpay payment page**

6. **Use Test Card Details:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25 (any future date)
   Cardholder Name: Test User
   ```

7. **Complete the payment**

8. **You'll be redirected back to your dashboard**

9. **Check your subscription status:**
   - Go to Settings/Subscription section
   - Status should show "Active"

10. **Verify in Razorpay Dashboard:**
    - Go to **Subscriptions** in Razorpay Dashboard
    - You should see your test subscription

11. **Check your database:**
    - Open Supabase → Table Editor → subscriptions
    - You should see a new row with Razorpay IDs

**Other Test Payment Methods:**
- **UPI**: Use `success@razorpay`
- **Net Banking**: Select any bank, use test credentials
- **Wallet**: Use any wallet option in test mode

---

### STEP 8: Verify Webhooks (5 minutes)

**Actions:**

1. After completing a test payment (Step 7)

2. Check your terminal/console logs:
   ```
   Razorpay webhook received: { event: 'subscription.activated', ... }
   Subscription activated: sub_xxxxx
   ```

3. If you see webhook logs, webhooks are working! ✅

4. If you don't see webhook logs:
   - Check ngrok is still running
   - Verify webhook URL in Razorpay Dashboard
   - Check webhook secret matches `.env.local`
   - Restart your Next.js app

---

## ✅ Success Checklist

Make sure all these are complete:

- [ ] ✅ Razorpay account created
- [ ] ✅ API keys generated (Key ID and Key Secret)
- [ ] ✅ Three subscription plans created in Razorpay Dashboard
- [ ] ✅ Environment variables configured in `.env.local`
- [ ] ✅ Database updated with Razorpay columns
- [ ] ✅ Webhook configured (for local: using ngrok)
- [ ] ✅ Application tested with test card
- [ ] ✅ Subscription shows as "Active" in app
- [ ] ✅ Subscription visible in Razorpay Dashboard
- [ ] ✅ Webhook events being received

---

## 🎉 You're Done!

Your Razorpay integration is now **fully operational**!

### What Works Now:

✅ **Subscription Creation**
- Users can subscribe to Starter, Pro, or Business plans
- Automatic redirection to Razorpay payment page
- Secure payment processing

✅ **Payment Processing**
- Support for all Indian payment methods
- Test mode for development
- Real-time payment confirmation

✅ **Webhook Events**
- Automatic subscription status updates
- Payment success/failure notifications
- Subscription lifecycle management

✅ **Subscription Management**
- Users can view their subscription
- Users can cancel subscriptions
- Subscription history tracking

---

## 🚀 Going Live (When Ready)

### Prerequisites for Live Mode:
1. Complete KYC in Razorpay (usually takes 24-48 hours)
2. Have a deployed production application
3. Have a registered domain with HTTPS

### Steps:
1. In Razorpay Dashboard, toggle to **Live Mode** (top-right)
2. Generate **Live API Keys**
3. Create subscription plans again in **Live Mode**
4. Update production environment variables with live keys
5. Configure production webhook URL (with your domain)
6. Test with small real payment first
7. Monitor for any issues

---

## 📚 Documentation Reference

- **Quick Start**: `RAZORPAY_QUICK_START.md` - 5-step guide
- **Complete Setup**: `RAZORPAY_SETUP.md` - Detailed instructions
- **Implementation**: `RAZORPAY_IMPLEMENTATION_SUMMARY.md` - Technical details
- **Database**: `RAZORPAY_DATABASE_SETUP.sql` - SQL scripts

---

## 🆘 Need Help?

### Common Issues:

**"Razorpay not configured" error**
→ Check `.env.local` variables are set correctly
→ Restart your Next.js app after setting variables

**Payment page doesn't load**
→ Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is correct
→ Check browser console for errors

**Webhook events not received**
→ Ensure ngrok is running (for local testing)
→ Verify webhook URL is correct
→ Check webhook secret matches

**Plan not found error**
→ Verify Plan IDs in Razorpay Dashboard match `.env.local`
→ Ensure you're in the correct mode (test/live)

### Get Support:

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com or use dashboard chat
- **Community**: Razorpay Developer Forum

---

## 💡 Pro Tips

1. **Always test in Test Mode first** before going live
2. **Keep your Key Secret secure** - never share or commit to Git
3. **Use environment variables** for all sensitive data
4. **Monitor webhook events** in Razorpay Dashboard
5. **Test cancellations** to ensure full lifecycle works
6. **Check database regularly** during testing
7. **Use ngrok for local webhook testing** - it's free and easy

---

## 📊 Monitoring Your Integration

### Things to Check Regularly:

1. **Razorpay Dashboard** → Subscriptions
   - Active subscriptions count
   - Payment success rate
   - Failed payments

2. **Your Database** → subscriptions table
   - Subscription statuses
   - Razorpay IDs populated
   - Current period dates

3. **Webhook Logs**
   - Events being received
   - No signature verification errors
   - Database updates successful

4. **User Feedback**
   - Payment flow smooth
   - Redirects working
   - Subscription status accurate

---

## 🎯 Summary

**What was the problem?**
Cashfree was not activating subscriptions properly.

**What's the solution?**
Implemented Razorpay as the new payment gateway.

**What do you need to do?**
Follow Steps 1-8 above (takes about 45 minutes total).

**Result:**
Fully functional subscription system with reliable payment processing.

---

## 🔥 Quick Command Reference

```bash
# Install dependencies (already done)
npm install razorpay

# Start development server
npm run dev

# Install ngrok for webhook testing
npm install -g ngrok

# Run ngrok (in separate terminal)
ngrok http 3000

# Run database migration
# (Copy SQL from RAZORPAY_DATABASE_SETUP.sql to Supabase)
```

---

**Ready to start? Begin with STEP 1 above!** 🚀

For any questions or issues, refer to `RAZORPAY_SETUP.md` for detailed explanations.

Good luck! 🎉




















