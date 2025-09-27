# Cashfree Payment Gateway Credentials Setup

## 🔑 **Required Environment Variables**

### **Add these to your `.env.local` file:**

```env
# Cashfree Payment Gateway Configuration
NEXT_PUBLIC_CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret_here

# Cashfree Subscription Plan IDs
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏢 **How to Get Cashfree Credentials**

### **Step 1: Create Cashfree Account**
1. Go to [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Click **"Sign Up"**
3. Fill in your business details
4. Complete email verification

### **Step 2: Complete KYC Verification**
1. Login to your Cashfree account
2. Go to **"Profile"** → **"KYC"**
3. Upload required documents:
   - PAN Card
   - Aadhaar Card
   - Bank Account Details
   - Business Registration (if applicable)
4. Wait for verification (usually 24-48 hours)

### **Step 3: Get API Credentials**
1. Go to **"Settings"** → **"API Keys"**
2. You'll find:
   - **App ID** (Public Key)
   - **Secret Key** (Private Key)
3. Copy these credentials

### **Step 4: Create Subscription Plans**
1. Go to **"Subscriptions"** → **"Plans"**
2. Click **"Create Plan"**
3. Create these 3 plans:

#### **Starter Plan**
```
Plan Name: MiniCRM Starter
Amount: 25000 (₹250 in paise)
Billing Period: Monthly
Billing Interval: 1
Plan ID: minicrm_starter_monthly
```

#### **Pro Plan**
```
Plan Name: MiniCRM Pro
Amount: 49900 (₹499 in paise)
Billing Period: Monthly
Billing Interval: 1
Plan ID: minicrm_pro_monthly
```

#### **Business Plan**
```
Plan Name: MiniCRM Business
Amount: 99900 (₹999 in paise)
Billing Period: Monthly
Billing Interval: 1
Plan ID: minicrm_business_monthly
```

### **Step 5: Configure Webhooks**
1. Go to **"Settings"** → **"Webhooks"**
2. Add webhook URL: `https://yourdomain.com/api/cashfree/webhook`
3. Select events:
   - `SUBSCRIPTION_ACTIVATED`
   - `SUBSCRIPTION_CANCELLED`
   - `SUBSCRIPTION_PAUSED`
   - `SUBSCRIPTION_RESUMED`
   - `PAYMENT_SUCCESS`
   - `PAYMENT_FAILED`
4. Copy the **Webhook Secret**

---

## 📝 **Environment Variables Explained**

### **Required Variables**

#### **1. NEXT_PUBLIC_CASHFREE_APP_ID**
- **What**: Your Cashfree App ID (Public Key)
- **Where**: Cashfree Dashboard → Settings → API Keys
- **Example**: `app_1234567890abcdef`
- **Usage**: Client-side payment initialization

#### **2. CASHFREE_SECRET_KEY**
- **What**: Your Cashfree Secret Key (Private Key)
- **Where**: Cashfree Dashboard → Settings → API Keys
- **Example**: `sk_test_1234567890abcdef`
- **Usage**: Server-side API calls
- **⚠️ Keep this secret!**

#### **3. CASHFREE_WEBHOOK_SECRET**
- **What**: Webhook signature verification secret
- **Where**: Cashfree Dashboard → Settings → Webhooks
- **Example**: `whsec_1234567890abcdef`
- **Usage**: Verify webhook authenticity

#### **4. Plan IDs**
- **NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID**: `minicrm_starter_monthly`
- **NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID**: `minicrm_pro_monthly`
- **NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID**: `minicrm_business_monthly`

#### **5. NEXT_PUBLIC_APP_URL**
- **What**: Your application URL
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Usage**: Return URLs for payments

---

## 🔧 **Complete .env.local Example**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cashfree Payment Gateway Configuration
NEXT_PUBLIC_CASHFREE_APP_ID=app_1234567890abcdef
CASHFREE_SECRET_KEY=sk_test_1234567890abcdef
CASHFREE_WEBHOOK_SECRET=whsec_1234567890abcdef

# Cashfree Subscription Plan IDs
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 **Testing vs Production**

### **Sandbox (Testing)**
- Use **test credentials** from Cashfree dashboard
- All payments are **simulated**
- No real money is charged
- Perfect for development and testing

### **Production (Live)**
- Use **live credentials** from Cashfree dashboard
- **Real payments** are processed
- Requires completed KYC verification
- Switch environment in code

---

## 🔒 **Security Best Practices**

### **1. Environment Variables**
- ✅ Never commit `.env.local` to git
- ✅ Use different credentials for test/production
- ✅ Rotate keys regularly
- ✅ Keep secret keys secure

### **2. API Keys**
- ✅ Use test keys for development
- ✅ Use live keys only in production
- ✅ Monitor API usage
- ✅ Set up alerts for unusual activity

### **3. Webhooks**
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for webhook URLs
- ✅ Implement idempotency
- ✅ Log all webhook events

---

## 🚀 **Quick Setup Checklist**

### **Cashfree Account Setup**
- [ ] Create Cashfree account
- [ ] Complete KYC verification
- [ ] Get API credentials (App ID + Secret Key)
- [ ] Create subscription plans
- [ ] Configure webhooks
- [ ] Get webhook secret

### **Environment Configuration**
- [ ] Add credentials to `.env.local`
- [ ] Set up plan IDs
- [ ] Configure app URL
- [ ] Test in sandbox mode
- [ ] Switch to production when ready

### **Testing**
- [ ] Test subscription creation
- [ ] Test payment flow
- [ ] Test webhook handling
- [ ] Verify database updates
- [ ] Test error handling

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **1. "Invalid App ID"**
- Check if App ID is correct
- Ensure you're using the right environment (test/production)
- Verify account status

#### **2. "Invalid Secret Key"**
- Check if Secret Key is correct
- Ensure no extra spaces or characters
- Verify key permissions

#### **3. "Plan not found"**
- Check if plan IDs match exactly
- Ensure plans are created in Cashfree dashboard
- Verify plan status is active

#### **4. "Webhook verification failed"**
- Check webhook secret
- Ensure webhook URL is accessible
- Verify signature calculation

---

## 📞 **Support**

- **Cashfree Support**: https://support.cashfree.com/
- **Documentation**: https://docs.cashfree.com/
- **API Reference**: https://docs.cashfree.com/docs/api-reference

---

**Next Steps**: After adding credentials, test the payment flow in sandbox mode before going live!
