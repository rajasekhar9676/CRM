# Subscription System Setup Guide

This guide will help you set up the subscription system for your MiniCRM application.

## 🗄️ Database Setup

### 1. Run the SQL Schema
Execute the SQL commands in `SUBSCRIPTION_SCHEMA.sql` in your Supabase SQL Editor:

```sql
-- This will create the subscriptions table with all necessary columns, indexes, and RLS policies
-- See SUBSCRIPTION_SCHEMA.sql for the complete schema
```

## 🔑 Stripe Setup

### 1. Create a Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new account or sign in
3. Switch to **Test mode** for development

### 2. Get Stripe API Keys
1. Go to **Developers** → **API Keys**
2. Copy your **Publishable key** and **Secret key**
3. Add them to your `.env.local` file

### 3. Create Products and Prices
1. Go to **Products** in your Stripe Dashboard
2. Create two products:

#### Pro Plan Product
- **Name**: MiniCRM Pro
- **Description**: Pro plan for growing businesses
- **Price**: ₹499/month (recurring)
- **Copy the Price ID** (starts with `price_`)

#### Business Plan Product
- **Name**: MiniCRM Business
- **Description**: Complete business solution
- **Price**: ₹999/month (recurring)
- **Copy the Price ID** (starts with `price_`)

### 4. Set up Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## 🔧 Environment Variables

Add these variables to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID=price_your_business_price_id_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 Features Implemented

### ✅ Subscription Plans
- **Free**: Up to 50 customers, 20 invoices/month
- **Pro**: ₹499/month → Unlimited customers, unlimited invoices, product management
- **Business**: ₹999/month → Pro + WhatsApp CRM + priority support

### ✅ Payment Integration
- Stripe Checkout for Pro/Business plans
- Webhook handling for subscription events
- Automatic subscription status updates

### ✅ UI Components
- Pricing section on homepage
- Subscription management in settings
- Usage limits and warnings
- Plan upgrade prompts

### ✅ Restriction Logic
- Free plan limits enforcement
- Usage tracking and display
- Upgrade prompts when limits reached

## 🚀 Testing the Subscription System

### 1. Test Free Plan
1. Sign up for a new account
2. Try adding customers and invoices
3. Verify limits are enforced at 50 customers and 20 invoices

### 2. Test Pro Plan Upgrade
1. Go to the pricing section
2. Click "Subscribe to Pro"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete the checkout process
5. Verify subscription is created in database

### 3. Test Business Plan Upgrade
1. Follow the same process as Pro plan
2. Verify all Business plan features are unlocked

### 4. Test Webhooks
1. Use Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Test subscription events in Stripe Dashboard

## 🔍 Monitoring

### Database Queries
```sql
-- View all active subscriptions
SELECT * FROM user_subscriptions;

-- View subscription statistics
SELECT 
  plan,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM subscriptions 
GROUP BY plan;

-- View usage by user
SELECT 
  u.email,
  s.plan,
  COUNT(DISTINCT c.id) as customer_count,
  COUNT(DISTINCT i.id) as invoice_count
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN customers c ON u.id = c.user_id
LEFT JOIN invoices i ON u.id = i.user_id
GROUP BY u.id, u.email, s.plan;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret in environment variables
   - Check Stripe webhook logs

2. **Subscription not created after payment**
   - Check webhook endpoint is working
   - Verify database permissions
   - Check console logs for errors

3. **Limits not enforced**
   - Verify subscription context is loaded
   - Check usage counting functions
   - Ensure proper error handling

### Debug Mode
Enable debug logging by adding to your environment:
```env
NEXT_PUBLIC_DEBUG_SUBSCRIPTION=true
```

## 📚 API Endpoints

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/stripe/cancel-subscription` - Cancel subscription (if implemented)

## 🔒 Security Notes

- All subscription data is protected by RLS policies
- Stripe webhooks are verified using signatures
- Sensitive keys are stored in environment variables
- User can only access their own subscription data

## 📈 Next Steps

1. **Analytics**: Add subscription analytics dashboard
2. **Billing**: Implement billing history and invoices
3. **Notifications**: Add email notifications for subscription events
4. **Trial**: Add free trial periods for paid plans
5. **Coupons**: Implement discount codes and promotions


