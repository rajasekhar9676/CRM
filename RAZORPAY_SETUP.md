# Razorpay Integration Setup Guide

This guide will walk you through setting up Razorpay payment integration for your MiniCRM application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Razorpay Account Setup](#razorpay-account-setup)
3. [Create Subscription Plans](#create-subscription-plans)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Going Live](#going-live)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:
- A Razorpay account (sign up at https://razorpay.com)
- Node.js and npm installed
- Your Next.js application set up
- Supabase database configured

---

## Razorpay Account Setup

### Step 1: Create a Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click on "Sign Up" and create your account
3. Complete the KYC verification process (required for live mode)
4. Once logged in, you'll see your Dashboard

### Step 2: Get API Keys

1. Log in to your Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click on **Generate Test Key** (or Live Key for production)
4. You'll get two keys:
   - **Key ID** (starts with `rzp_test_` for test mode)
   - **Key Secret** (keep this confidential)
5. Save these keys securely - you'll need them later

---

## Create Subscription Plans

Razorpay requires you to create subscription plans before you can use them. Here's how:

### Step 1: Navigate to Subscriptions

1. In your Razorpay Dashboard, go to **Subscriptions** → **Plans**
2. Click on **Create New Plan**

### Step 2: Create Starter Plan

Create a plan with these details:
- **Plan Name**: Starter Plan
- **Plan ID**: `minicrm_starter_monthly` (or your custom ID)
- **Billing Interval**: Monthly (1 month)
- **Billing Amount**: ₹249.00
- **Currency**: INR
- **Description**: Perfect for small businesses

Click **Create Plan** and save the Plan ID.

### Step 3: Create Pro Plan

Create another plan:
- **Plan Name**: Pro Plan
- **Plan ID**: `minicrm_pro_monthly` (or your custom ID)
- **Billing Interval**: Monthly (1 month)
- **Billing Amount**: ₹499.00
- **Currency**: INR
- **Description**: For growing businesses

Click **Create Plan** and save the Plan ID.

### Step 4: Create Business Plan

Create the third plan:
- **Plan Name**: Business Plan
- **Plan ID**: `minicrm_business_monthly` (or your custom ID)
- **Billing Interval**: Monthly (1 month)
- **Billing Amount**: ₹999.00
- **Currency**: INR
- **Description**: Complete business solution

Click **Create Plan** and save the Plan ID.

---

## Environment Configuration

### Step 1: Update Environment Variables

Create or update your `.env.local` file in the root of your project:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Razorpay Plan IDs (from the plans you created)
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=minicrm_business_monthly

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Replace Values

Replace the placeholder values with your actual credentials:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
- `RAZORPAY_WEBHOOK_SECRET`: We'll set this up in the webhook section
- Plan IDs: Use the exact Plan IDs you created in Razorpay Dashboard

### Important Notes:
- Keep `RAZORPAY_KEY_SECRET` confidential - never commit it to version control
- For production, use live keys (starting with `rzp_live_`)
- Make sure `NEXT_PUBLIC_APP_URL` matches your deployed URL in production

---

## Database Setup

### Step 1: Update Subscriptions Table

Run this SQL in your Supabase SQL Editor to add Razorpay columns:

```sql
-- Add Razorpay columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_razorpay_subscription_id 
ON subscriptions(razorpay_subscription_id);

CREATE INDEX IF NOT EXISTS idx_razorpay_customer_id 
ON subscriptions(razorpay_customer_id);
```

### Step 2: Verify Table Structure

Your `subscriptions` table should now have these columns:
- `id`
- `user_id`
- `plan`
- `status`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `razorpay_subscription_id` (new)
- `razorpay_customer_id` (new)
- `created_at`
- `updated_at`

---

## Webhook Configuration

Webhooks allow Razorpay to notify your application about subscription events (payments, cancellations, etc.).

### Step 1: Generate Webhook Secret

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click on **Add New Webhook**
3. Enter webhook details:
   - **Webhook URL**: `https://yourdomain.com/api/razorpay/webhook`
   - **Alert Email**: Your email address
   - **Secret**: Click "Generate Secret" or create your own
4. Select these events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.completed`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
   - `subscription.pending`
   - `subscription.halted`
   - `payment.failed`

5. Click **Create Webhook**

### Step 2: Update Environment Variable

Add the webhook secret to your `.env.local`:

```env
RAZORPAY_WEBHOOK_SECRET=your_generated_webhook_secret
```

### Step 3: For Local Testing

To test webhooks locally:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start your Next.js app:
   ```bash
   npm run dev
   ```

3. In a new terminal, run ngrok:
   ```bash
   ngrok http 3000
   ```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update the webhook URL in Razorpay Dashboard to:
   ```
   https://abc123.ngrok.io/api/razorpay/webhook
   ```

---

## Testing

### Step 1: Test Subscription Creation

1. Start your application:
   ```bash
   npm run dev
   ```

2. Log in to your application
3. Navigate to the Pricing page
4. Click on "Subscribe to Starter" (or any plan)
5. You should be redirected to Razorpay's payment page

### Step 2: Test Payment

Razorpay provides test cards for testing:

**Test Card Details:**
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name

**Test UPI:**
- **UPI ID**: `success@razorpay`

**Test Netbanking:**
- Select any bank
- Use the test credentials provided

### Step 3: Verify Subscription

After successful payment:
1. Check your Razorpay Dashboard under **Subscriptions**
2. Check your application's database (subscriptions table)
3. Verify the subscription status is "active"
4. Check that webhook events are being received

---

## Going Live

### Step 1: Complete KYC

1. In Razorpay Dashboard, complete your KYC verification
2. Wait for approval (usually 24-48 hours)

### Step 2: Switch to Live Mode

1. In Razorpay Dashboard, toggle to **Live Mode**
2. Generate new Live API Keys
3. Create subscription plans in Live Mode (same as test mode)
4. Create a new webhook for Live Mode

### Step 3: Update Environment Variables

Update your production environment variables:

```env
# Live Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret

# Live Plan IDs
NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID=minicrm_starter_monthly_live
NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID=minicrm_pro_monthly_live
NEXT_PUBLIC_RAZORPAY_BUSINESS_PLAN_ID=minicrm_business_monthly_live

# Production URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 4: Deploy

1. Deploy your application to production
2. Update webhook URL to your production domain
3. Test with real payment methods

---

## Troubleshooting

### Issue: "Razorpay not configured" error

**Solution:**
- Verify all environment variables are set correctly
- Restart your development server after adding environment variables
- Check that variables start with `NEXT_PUBLIC_` for client-side access

### Issue: Webhook signature verification fails

**Solution:**
- Ensure `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard
- Check that the webhook URL is correct
- Verify your server is accessible from the internet

### Issue: Subscription creation fails

**Solution:**
- Verify Plan IDs match exactly with Razorpay Dashboard
- Check that plans are created in the correct mode (test/live)
- Ensure API keys are valid and not expired
- Check server logs for detailed error messages

### Issue: Payment page doesn't load

**Solution:**
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly
- Check browser console for errors
- Ensure you're using the correct mode (test/live)

### Issue: Webhook events not received

**Solution:**
- Check webhook URL is publicly accessible
- Verify selected events in Razorpay Dashboard
- Check server logs for webhook processing errors
- Use ngrok for local testing

### Issue: Database errors

**Solution:**
- Verify subscriptions table exists and has correct columns
- Run the database setup SQL script
- Check Supabase connection credentials

---

## Important Notes

### Security Best Practices

1. **Never expose your Key Secret**: Only use it server-side
2. **Always verify webhook signatures**: Prevent unauthorized webhook calls
3. **Use environment variables**: Never hardcode credentials
4. **Enable HTTPS**: Required for production webhooks
5. **Regularly rotate keys**: Update keys periodically

### Rate Limits

Razorpay has API rate limits:
- Test Mode: 100 requests per minute
- Live Mode: Contact Razorpay for limits

### Payment Gateway Charges

Razorpay charges:
- **Domestic Cards**: 2% per transaction
- **International Cards**: 3% per transaction
- **UPI**: 2% per transaction
- **Netbanking**: 2% per transaction
- **Wallets**: 2% per transaction

No setup fees or annual maintenance charges.

### Support

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Razorpay Dashboard**: https://dashboard.razorpay.com

---

## API Endpoints

Your application now has these Razorpay endpoints:

### Create Subscription
```
POST /api/razorpay/create-subscription
Body: { plan: 'starter' | 'pro' | 'business' }
```

### Cancel Subscription
```
POST /api/razorpay/cancel-subscription
Body: { subscriptionId: string, cancelAtCycleEnd: boolean }
```

### Webhook Handler
```
POST /api/razorpay/webhook
Headers: { x-razorpay-signature: string }
```

---

## Next Steps

1. ✅ Complete Razorpay account setup
2. ✅ Create subscription plans
3. ✅ Configure environment variables
4. ✅ Set up database
5. ✅ Configure webhooks
6. ✅ Test in development
7. ✅ Complete KYC for live mode
8. ✅ Deploy to production
9. ✅ Test live payments

---

## Additional Resources

- [Razorpay Subscriptions Documentation](https://razorpay.com/docs/subscriptions/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/test-card-details/)

---

## FAQ

**Q: Can I use both Razorpay and Cashfree/Stripe?**
A: Yes, but you should use one primary payment gateway. The system is designed to work with Razorpay now.

**Q: How do I handle failed payments?**
A: Razorpay automatically retries failed payments. You'll receive webhook events for failures.

**Q: Can customers change plans?**
A: Yes, but they need to cancel the current subscription and create a new one. This is a limitation of Razorpay's subscription model.

**Q: How do I refund a payment?**
A: Use the Razorpay Dashboard to issue refunds manually. You can also use the Razorpay API.

**Q: What happens when a subscription expires?**
A: Razorpay will automatically charge the customer at the end of each billing cycle. If payment fails, the subscription status changes to "halted".

---

## Conclusion

You've successfully set up Razorpay integration! Your MiniCRM application can now:
- ✅ Create subscriptions for different plans
- ✅ Process recurring payments automatically
- ✅ Handle subscription lifecycle events via webhooks
- ✅ Allow users to cancel subscriptions
- ✅ Track subscription status in real-time

For any issues or questions, refer to the troubleshooting section or contact Razorpay support.

Happy selling! 🚀


