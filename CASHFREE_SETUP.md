# Cashfree Payment Integration Setup Guide

## Overview
This guide will help you set up Cashfree payment integration for your MiniCRM application with strategic pricing starting from ₹250.

## Strategic Pricing Structure

### 1. **Free Plan** - ₹0/month
- Up to 50 customers
- 20 invoices per month
- Basic dashboard
- Email support

### 2. **Starter Plan** - ₹250/month ⭐ **Most Popular**
- Up to 200 customers
- 100 invoices per month
- Basic product management
- Email support
- Basic analytics

### 3. **Pro Plan** - ₹499/month
- Unlimited customers
- Unlimited invoices
- Advanced product management
- Advanced analytics
- Priority email support
- WhatsApp integration

### 4. **Business Plan** - ₹999/month
- Everything in Pro
- Advanced WhatsApp CRM
- Priority phone support
- Advanced automation
- Custom integrations
- Dedicated account manager

## Cashfree Account Setup

### Step 1: Create Cashfree Account
1. Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Sign up for a new account
3. Complete KYC verification
4. Get your App ID and Secret Key

### Step 2: Create Subscription Plans
1. Login to Cashfree Dashboard
2. Go to **Subscriptions** → **Plans**
3. Create the following plans:

#### Starter Plan (₹250/month)
- Plan Name: `MiniCRM Starter`
- Amount: `25000` (in paise)
- Billing Period: `Monthly`
- Plan ID: `minicrm_starter_monthly`

#### Pro Plan (₹499/month)
- Plan Name: `MiniCRM Pro`
- Amount: `49900` (in paise)
- Billing Period: `Monthly`
- Plan ID: `minicrm_pro_monthly`

#### Business Plan (₹999/month)
- Plan Name: `MiniCRM Business`
- Amount: `99900` (in paise)
- Billing Period: `Monthly`
- Plan ID: `minicrm_business_monthly`

### Step 3: Configure Webhooks
1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/cashfree/webhook`
3. Select events:
   - `SUBSCRIPTION_ACTIVATED`
   - `SUBSCRIPTION_CANCELLED`
   - `SUBSCRIPTION_PAUSED`
   - `SUBSCRIPTION_RESUMED`
   - `PAYMENT_SUCCESS`
   - `PAYMENT_FAILED`

## Environment Variables

Add these to your `.env.local` file:

```env
# Cashfree Configuration
NEXT_PUBLIC_CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret_here
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly
```

## Database Schema Update

The subscription table should include Cashfree fields:

```sql
-- Add Cashfree columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cashfree_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS cashfree_customer_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_cashfree_id 
ON subscriptions(cashfree_subscription_id);
```

## Testing the Integration

### 1. Test Mode
- Use Cashfree sandbox environment for testing
- Test with sandbox credentials
- Verify webhook delivery

### 2. Production Mode
- Switch to production environment
- Use live credentials
- Test with real payment methods

## Payment Flow

1. **User selects plan** → Clicks "Subscribe" button
2. **API call** → `/api/cashfree/create-subscription`
3. **Cashfree redirect** → User redirected to payment page
4. **Payment processing** → User completes payment
5. **Webhook notification** → Cashfree sends webhook
6. **Database update** → Subscription status updated
7. **User redirected** → Back to dashboard with success message

## Webhook Security

The webhook handler includes signature verification:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
  .update(body)
  .digest('hex');
```

## Error Handling

The integration includes comprehensive error handling for:
- Invalid plan selection
- User authentication failures
- Cashfree API errors
- Webhook signature verification
- Database update failures

## Monitoring and Analytics

Track these metrics:
- Subscription conversion rates
- Payment success rates
- Plan upgrade/downgrade patterns
- Revenue per user
- Churn rates

## Support and Documentation

- [Cashfree Documentation](https://docs.cashfree.com/)
- [Cashfree API Reference](https://docs.cashfree.com/docs/api-reference)
- [Cashfree Webhooks](https://docs.cashfree.com/docs/webhooks)

## Troubleshooting

### Common Issues:

1. **Webhook not received**
   - Check webhook URL is accessible
   - Verify webhook secret
   - Check server logs

2. **Payment failures**
   - Verify plan IDs
   - Check customer details
   - Review Cashfree dashboard

3. **Subscription not activated**
   - Check webhook processing
   - Verify database updates
   - Review error logs

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures**
3. **Use HTTPS** for all webhook URLs
4. **Implement rate limiting** for API endpoints
5. **Log all payment events** for audit trails

## Next Steps

1. Set up Cashfree account and plans
2. Configure environment variables
3. Test the integration in sandbox
4. Deploy to production
5. Monitor payment flows
6. Optimize conversion rates

---

**Note**: This integration replaces the previous Stripe implementation. Make sure to update your payment processing accordingly.
