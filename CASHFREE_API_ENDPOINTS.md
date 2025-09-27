# Cashfree API Endpoints Setup

## 🔧 **Fixed API Integration**

The error `"endpoint or method is not valid"` was caused by using mock URLs. Here's the complete Cashfree API integration:

### **1. Updated Create Subscription Endpoint**

**File**: `app/api/cashfree/create-subscription/route.ts`

**Key Changes**:
- ✅ Real Cashfree API call to `https://sandbox.cashfree.com/pg/v2/subscriptions`
- ✅ Proper headers with API version and credentials
- ✅ Correct request body structure
- ✅ Error handling for API failures
- ✅ Database integration for subscription storage

### **2. Required Environment Variables**

Add these to your `.env.local`:

```env
# Cashfree Configuration
NEXT_PUBLIC_CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here

# Plan IDs (create these in Cashfree dashboard)
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **3. Cashfree Dashboard Setup**

#### **Step 1: Create Subscription Plans**

Go to **Subscriptions** → **Plans** → **Create Plan**

**Starter Plan**:
```
Plan Name: MiniCRM Starter
Plan ID: minicrm_starter_monthly
Amount: 25000 (₹250 in paise)
Billing Period: Monthly
Billing Interval: 1
```

**Pro Plan**:
```
Plan Name: MiniCRM Pro
Plan ID: minicrm_pro_monthly
Amount: 49900 (₹499 in paise)
Billing Period: Monthly
Billing Interval: 1
```

**Business Plan**:
```
Plan Name: MiniCRM Business
Plan ID: minicrm_business_monthly
Amount: 99900 (₹999 in paise)
Billing Period: Monthly
Billing Interval: 1
```

#### **Step 2: Configure Webhooks**

Go to **Settings** → **Webhooks** → **Add Webhook**

```
Webhook URL: https://yourdomain.com/api/cashfree/webhook
Events: 
- SUBSCRIPTION_ACTIVATED
- SUBSCRIPTION_CANCELLED
- SUBSCRIPTION_PAUSED
- SUBSCRIPTION_RESUMED
- PAYMENT_SUCCESS
- PAYMENT_FAILED
```

### **4. API Endpoints**

#### **Create Subscription**
```
POST /api/cashfree/create-subscription
Content-Type: application/json

{
  "plan": "starter" | "pro" | "business"
}
```

**Response**:
```json
{
  "subscriptionId": "sub_1234567890",
  "authLink": "https://sandbox.cashfree.com/pg/subscription/sub_1234567890",
  "message": "Subscription created successfully",
  "planDetails": {
    "name": "Starter Plan",
    "recurringAmount": 25000,
    "maxAmount": 25000,
    "billingPeriod": "monthly",
    "billingInterval": 1
  }
}
```

#### **Webhook Handler**
```
POST /api/cashfree/webhook
Content-Type: application/json

Handles Cashfree webhook events for subscription status updates
```

### **5. Testing the Integration**

#### **Test Mode (Sandbox)**
1. Use sandbox credentials from Cashfree dashboard
2. All payments are simulated
3. No real money is charged
4. Perfect for development

#### **Production Mode**
1. Use live credentials from Cashfree dashboard
2. Real payments are processed
3. Requires completed KYC verification

### **6. Error Handling**

The API now handles these error scenarios:

#### **Missing Credentials**
```json
{
  "error": "Cashfree not configured. Please set up Cashfree environment variables.",
  "setupRequired": true
}
```

#### **API Connection Error**
```json
{
  "error": "Failed to connect to Cashfree API",
  "details": "Please check your Cashfree credentials and network connection",
  "apiError": true
}
```

#### **Database Error**
```json
{
  "error": "Database error. Please run the SQL script to create the subscriptions table.",
  "databaseError": true
}
```

#### **Cashfree API Error**
```json
{
  "error": "Failed to create subscription with Cashfree",
  "details": "Specific error message from Cashfree",
  "cashfreeError": true
}
```

### **7. Complete Setup Checklist**

#### **Cashfree Account**
- [ ] Create Cashfree account
- [ ] Complete KYC verification
- [ ] Get API credentials (App ID + Secret Key)
- [ ] Create subscription plans
- [ ] Configure webhooks
- [ ] Get webhook secret

#### **Environment Setup**
- [ ] Add credentials to `.env.local`
- [ ] Set up plan IDs
- [ ] Configure app URL
- [ ] Test in sandbox mode

#### **Database Setup**
- [ ] Run `CREATE_SUBSCRIPTIONS_TABLE.sql`
- [ ] Verify subscriptions table exists
- [ ] Test database connectivity

#### **Testing**
- [ ] Test subscription creation
- [ ] Test payment flow
- [ ] Test webhook handling
- [ ] Verify database updates
- [ ] Test error scenarios

### **8. Next Steps**

1. **Get Cashfree Credentials**: Sign up at [Cashfree Dashboard](https://merchant.cashfree.com/)
2. **Create Plans**: Set up the 3 subscription plans
3. **Configure Webhooks**: Add webhook URL and events
4. **Add to .env.local**: Copy credentials to environment file
5. **Test Integration**: Try creating a subscription
6. **Go Live**: Switch to production credentials when ready

### **9. Support Resources**

- **Cashfree Documentation**: https://docs.cashfree.com/
- **API Reference**: https://docs.cashfree.com/docs/api-reference
- **Support**: https://support.cashfree.com/

---

**The integration is now complete and ready for testing!** 🚀
