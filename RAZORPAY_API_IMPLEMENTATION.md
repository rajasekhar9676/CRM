# ✅ Razorpay Subscription API Implementation

## 📋 Overview

This document explains how the Razorpay Subscription API is implemented according to the [official Razorpay documentation](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/).

## ✅ What's Implemented

### **Required Parameters**
- ✅ `plan_id` - The unique identifier of the plan
- ✅ `total_count` - Number of billing cycles (default: 12 for 1 year)

### **Optional Parameters**
- ✅ `quantity` - Number of times to charge per invoice (default: 1)
- ✅ `customer_notify` - Boolean, whether Razorpay handles customer communication (default: true)
- ✅ `expire_by` - Unix timestamp for when customer can make authorization payment (default: 30 days from now)
- ✅ `start_at` - Unix timestamp for future-dated subscriptions (optional, not used for immediate subscriptions)
- ✅ `addons` - Array for upfront charges (optional)
- ✅ `offer_id` - Offer linked to subscription (optional)
- ✅ `notes` - Key-value pairs for notes (includes customer details)

### **Auto-Added Parameters**
- ✅ `customer_id` - Automatically created or reused from existing Razorpay customers

## 🔧 Implementation Details

### **Function Signature**
```typescript
createRazorpaySubscription(
  planId: string,
  customerDetails: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  },
  options?: {
    totalCount?: number;        // Default: 12
    quantity?: number;           // Default: 1
    customerNotify?: boolean;   // Default: true
    startAt?: number;            // Unix timestamp (optional)
    expireBy?: number;           // Unix timestamp (default: 30 days)
    addons?: Array<{...}>;       // Optional upfront charges
    offerId?: string;            // Optional offer ID
    notes?: Record<string, string>; // Optional additional notes
  }
)
```

### **Key Fixes Applied**
1. ✅ **`customer_notify`**: Changed from number `1` to boolean `true` (matches API spec)
2. ✅ **`expire_by`**: Added automatically (30 days from now) to ensure customers complete authorization
3. ✅ **All optional parameters**: Properly implemented with correct types
4. ✅ **Customer reuse**: Automatically finds and reuses existing Razorpay customers

## 📝 Example API Request (What We Send)

```json
{
  "plan_id": "plan_RU6UHkpXz37JZm",
  "customer_id": "cust_RZdghFYsb7u8JZ",
  "total_count": 12,
  "quantity": 1,
  "customer_notify": true,
  "expire_by": 1735689600,
  "notes": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com"
  }
}
```

## 📥 Example API Response (What We Receive)

```json
{
  "id": "sub_00000000000001",
  "entity": "subscription",
  "plan_id": "plan_00000000000001",
  "status": "created",
  "current_start": null,
  "current_end": null,
  "ended_at": null,
  "quantity": 1,
  "charge_at": 1580453311,
  "start_at": 1580626111,
  "end_at": 1583433000,
  "auth_attempts": 0,
  "total_count": 12,
  "paid_count": 0,
  "customer_notify": true,
  "created_at": 1580280581,
  "expire_by": 1580626111,
  "short_url": "https://rzp.io/i/z3b1R61A9",
  "has_scheduled_changes": false,
  "change_scheduled_at": null,
  "source": "api",
  "remaining_count": 11
}
```

## 🎯 Usage in Code

### **API Route** (`app/api/razorpay/create-subscription/route.ts`)
```typescript
const subscription = await createRazorpaySubscription(
  planConfig.planId,
  customerDetails,
  {
    totalCount: 12,      // 12 billing cycles
    quantity: 1,        // Default quantity
    customerNotify: true, // Razorpay handles communication
    // expireBy: automatically set to 30 days
  }
);
```

## ✅ What's Working

1. ✅ **Plan ID**: Correctly passed from environment variables
2. ✅ **Customer Creation**: Automatically creates or reuses customers
3. ✅ **Subscription Creation**: Uses correct API parameters
4. ✅ **Authorization URL**: Returns `short_url` for customer payment
5. ✅ **Database Storage**: Saves subscription details to Supabase
6. ✅ **Error Handling**: Handles "customer already exists" errors
7. ✅ **Webhook Support**: Receives and processes subscription events

## ⚠️ Known Issues & Solutions

### **1. "Hosted page is not available"**
- **Issue**: Razorpay returns this when hosted checkout is disabled
- **Solution**: Enable "Hosted Checkout" in Razorpay Dashboard → Settings → Subscriptions
- **Reference**: Contact Razorpay support if needed

### **2. "Next Due on" Empty in Dashboard**
- **Issue**: Razorpay dashboard shows "--" for created subscriptions
- **Solution**: This is normal. `next_due_date` is calculated and stored in our database
- **Action**: Use "Sync Subscriptions" button in admin panel

## 📚 Reference Links

- [Razorpay Subscription API Docs](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Subscription Lifecycle](https://razorpay.com/docs/payments/subscriptions/lifecycle/)

## 🔍 Debugging

### **Enable Logging**
The implementation logs all subscription data being sent:
- Plan ID
- Customer ID
- Total count
- Quantity
- Customer notify (boolean)
- Expire by (timestamp and formatted date)
- Start at (if set)
- Addons (if any)
- Offer ID (if any)
- Notes

### **Check Logs**
Look for these console messages:
- `📤 Creating Razorpay subscription with data:` - Shows request payload
- `✅ Razorpay subscription created successfully:` - Shows response

## 🚀 Next Steps (Optional Enhancements)

1. **Addons**: Implement upfront charges if needed
2. **Offers**: Link promotional offers to subscriptions
3. **Future-dated Subscriptions**: Use `start_at` for scheduled subscriptions
4. **Custom Expiry**: Allow configurable `expire_by` per subscription
5. **Quantity Changes**: Allow customers to modify quantity mid-subscription

---

**Last Updated**: Based on Razorpay API documentation as of 2024
**Status**: ✅ Fully compliant with Razorpay API specification


