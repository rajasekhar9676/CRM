# Cashfree Maximum and Recurring Amount Configuration

## 📋 **Understanding Maximum and Recurring Amounts**

### **Recurring Amount**
- **Definition**: The fixed amount charged at each billing cycle
- **Example**: ₹250 every month
- **In Paise**: 25000 (₹250 × 100)

### **Maximum Amount**
- **Definition**: The maximum amount that can be charged in a single billing cycle
- **Purpose**: Prevents overcharging due to usage spikes
- **Example**: ₹250 maximum per month

---

## 🔧 **Current Configuration**

### **Starter Plan (₹250/month)**
```javascript
{
  planId: 'minicrm_starter_monthly',
  price: 250,
  name: 'Starter Plan',
  recurringAmount: 25000, // ₹250 in paise
  maxAmount: 25000, // Maximum ₹250 per cycle
  billingPeriod: 'monthly',
  billingInterval: 1, // Every 1 month
}
```

### **Pro Plan (₹499/month)**
```javascript
{
  planId: 'minicrm_pro_monthly',
  price: 499,
  name: 'Pro Plan',
  recurringAmount: 49900, // ₹499 in paise
  maxAmount: 49900, // Maximum ₹499 per cycle
  billingPeriod: 'monthly',
  billingInterval: 1, // Every 1 month
}
```

### **Business Plan (₹999/month)**
```javascript
{
  planId: 'minicrm_business_monthly',
  price: 999,
  name: 'Business Plan',
  recurringAmount: 99900, // ₹999 in paise
  maxAmount: 99900, // Maximum ₹999 per cycle
  billingPeriod: 'monthly',
  billingInterval: 1, // Every 1 month
}
```

---

## 💰 **How to Enter Amounts**

### **1. In Cashfree Dashboard**

#### **Step 1: Create Subscription Plan**
1. Go to **Cashfree Dashboard** → **Subscriptions** → **Plans**
2. Click **"Create Plan"**

#### **Step 2: Configure Plan Details**
```
Plan Name: MiniCRM Starter
Amount: 25000 (in paise = ₹250)
Billing Period: Monthly
Billing Interval: 1
Maximum Amount: 25000 (in paise = ₹250)
```

#### **Step 3: Advanced Settings**
```
Recurring Amount: 25000
Maximum Amount: 25000
Billing Period: monthly
Billing Interval: 1
```

### **2. In Code Configuration**

#### **File: `lib/cashfree.ts`**
```javascript
export const CASHFREE_PLANS = {
  starter: {
    planId: 'minicrm_starter_monthly',
    price: 250, // Display price in ₹
    name: 'Starter Plan',
    recurringAmount: 25000, // Amount in paise
    maxAmount: 25000, // Maximum in paise
    billingPeriod: 'monthly',
    billingInterval: 1,
  },
  // ... other plans
};
```

---

## 🔄 **Billing Period Options**

### **Monthly Billing**
```javascript
billingPeriod: 'monthly',
billingInterval: 1, // Every 1 month
```

### **Quarterly Billing**
```javascript
billingPeriod: 'monthly',
billingInterval: 3, // Every 3 months
```

### **Annual Billing**
```javascript
billingPeriod: 'yearly',
billingInterval: 1, // Every 1 year
```

---

## 💡 **Amount Calculation Examples**

### **Example 1: Monthly Plan**
- **Price**: ₹250/month
- **Recurring Amount**: 25000 paise
- **Maximum Amount**: 25000 paise
- **Billing**: Every 1 month

### **Example 2: Quarterly Plan**
- **Price**: ₹750/quarter (₹250 × 3)
- **Recurring Amount**: 75000 paise
- **Maximum Amount**: 75000 paise
- **Billing**: Every 3 months

### **Example 3: Annual Plan**
- **Price**: ₹3000/year (₹250 × 12)
- **Recurring Amount**: 300000 paise
- **Maximum Amount**: 300000 paise
- **Billing**: Every 1 year

---

## 🛠️ **Customizing Amounts**

### **1. Change Recurring Amount**
```javascript
// In lib/cashfree.ts
starter: {
  recurringAmount: 30000, // Change to ₹300
  maxAmount: 30000, // Update max amount too
}
```

### **2. Set Different Maximum Amount**
```javascript
// Allow usage-based billing up to ₹500
starter: {
  recurringAmount: 25000, // Base ₹250
  maxAmount: 50000, // Maximum ₹500
}
```

### **3. Add New Plan**
```javascript
// Add Enterprise plan
enterprise: {
  planId: 'minicrm_enterprise_monthly',
  price: 1999,
  name: 'Enterprise Plan',
  recurringAmount: 199900, // ₹1999 in paise
  maxAmount: 199900,
  billingPeriod: 'monthly',
  billingInterval: 1,
}
```

---

## 📊 **Environment Variables**

### **Add to `.env.local`**
```env
# Cashfree Plan IDs
NEXT_PUBLIC_CASHFREE_STARTER_PLAN_ID=minicrm_starter_monthly
NEXT_PUBLIC_CASHFREE_PRO_PLAN_ID=minicrm_pro_monthly
NEXT_PUBLIC_CASHFREE_BUSINESS_PLAN_ID=minicrm_business_monthly

# Optional: Add new plan
NEXT_PUBLIC_CASHFREE_ENTERPRISE_PLAN_ID=minicrm_enterprise_monthly
```

---

## 🔍 **Testing Amount Configuration**

### **1. Test API Response**
```bash
# Test subscription creation
curl -X POST http://localhost:3000/api/cashfree/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"plan": "starter"}'
```

### **2. Expected Response**
```json
{
  "subscriptionId": "sub_1234567890_abc123",
  "authLink": "https://sandbox.cashfree.com/pg/subscription/sub_1234567890_abc123",
  "message": "Subscription created successfully (Test Mode)",
  "testMode": true,
  "planDetails": {
    "name": "Starter Plan",
    "recurringAmount": 25000,
    "maxAmount": 25000,
    "billingPeriod": "monthly",
    "billingInterval": 1
  }
}
```

---

## ⚠️ **Important Notes**

### **1. Amount in Paise**
- Cashfree requires amounts in **paise** (smallest currency unit)
- ₹1 = 100 paise
- Always multiply by 100 when converting from ₹ to paise

### **2. Maximum Amount Rules**
- Maximum amount should be ≥ recurring amount
- Set maximum amount to prevent overcharging
- Useful for usage-based billing models

### **3. Billing Period Consistency**
- Ensure billing period matches between Cashfree dashboard and code
- Use consistent intervals (1, 3, 6, 12 months)

### **4. Plan ID Matching**
- Plan ID in code must match Cashfree dashboard
- Use descriptive, unique plan IDs
- Include billing period in plan ID

---

## 🚀 **Next Steps**

1. **Update Plan Amounts**: Modify amounts in `lib/cashfree.ts`
2. **Create Plans in Cashfree**: Set up plans in dashboard
3. **Test Configuration**: Verify amounts in test mode
4. **Deploy to Production**: Update environment variables
5. **Monitor Billing**: Check subscription creation and billing

The system now supports flexible amount configuration with maximum and recurring amount controls for better billing management.
