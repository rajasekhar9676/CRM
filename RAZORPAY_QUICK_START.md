# Razorpay Quick Start Guide

Get Razorpay working in your MiniCRM app in **5 simple steps**!

## Step 1: Create Razorpay Account (5 minutes)

1. Go to https://razorpay.com and sign up
2. Log in to your Dashboard
3. Go to **Settings** → **API Keys**
4. Click **Generate Test Key**
5. Save your Key ID and Key Secret

## Step 2: Create Subscription Plans (10 minutes)

In Razorpay Dashboard, go to **Subscriptions** → **Plans** and create these three plans:

### Starter Plan
- **Plan ID**: `minicrm_starter_monthly`
- **Amount**: ₹249
- **Interval**: Monthly (1 month)
- **Currency**: INR

### Pro Plan
- **Plan ID**: `minicrm_pro_monthly`
- **Amount**: ₹499
- **Interval**: Monthly (1 month)
- **Currency**: INR

### Business Plan
- **Plan ID**: `minicrm_business_monthly`
- **Amount**: ₹999
- **Interval**: Monthly (1 month)
- **Currency**: INR

> **Important**: Save the exact Plan IDs - you'll need them in Step 3!

## Step 3: Set Environment Variables (2 minutes)

Create `.env.local` in your project root and add:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Plan IDs (use the exact IDs you created)
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=minicrm_business_monthly

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual credentials from Step 1 and Plan IDs from Step 2.

## Step 4: Update Database (1 minute)

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_razorpay_subscription_id 
ON subscriptions(razorpay_subscription_id);
```

Or simply run the `RAZORPAY_DATABASE_SETUP.sql` file.

## Step 5: Configure Webhook (3 minutes)

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Enter:
   - **URL**: `http://localhost:3000/api/razorpay/webhook` (for testing)
   - **Secret**: Generate or create a secret
4. Select these events:
   - subscription.activated
   - subscription.charged
   - subscription.cancelled
   - payment.failed
5. Click **Create**
6. Copy the secret and add it to your `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

### For Local Testing

Use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In a new terminal, run ngrok
ngrok http 3000

# Copy the HTTPS URL and update webhook URL in Razorpay Dashboard
# Example: https://abc123.ngrok.io/api/razorpay/webhook
```

## Test It! 🎉

1. Restart your Next.js app:
   ```bash
   npm run dev
   ```

2. Log in to your application

3. Go to Pricing page

4. Click "Subscribe to Starter"

5. Use test card:
   - **Card**: `4111 1111 1111 1111`
   - **CVV**: `123`
   - **Expiry**: `12/25`

6. Complete payment

7. Check your dashboard - subscription should be active!

## That's It! ✅

Your Razorpay integration is ready to use!

### What You Can Do Now:
- ✅ Create subscriptions
- ✅ Process payments
- ✅ Handle recurring billing
- ✅ Cancel subscriptions
- ✅ Track subscription status

## Need More Help?

- **Detailed Setup**: See `RAZORPAY_SETUP.md`
- **Implementation Details**: See `RAZORPAY_IMPLEMENTATION_SUMMARY.md`
- **Razorpay Docs**: https://razorpay.com/docs/
- **Support**: support@razorpay.com

## Going Live (Later)

When you're ready for production:

1. Complete KYC in Razorpay Dashboard
2. Switch to Live Mode
3. Generate Live API Keys
4. Create plans in Live Mode
5. Update environment variables with live keys
6. Update webhook URL to production domain
7. Test with real payment

---

**Quick Reference - Test Cards:**
- Success: `4111 1111 1111 1111`
- UPI: `success@razorpay`
- Any bank for netbanking

Happy selling! 🚀


