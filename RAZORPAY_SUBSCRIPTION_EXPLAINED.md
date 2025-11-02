# Razorpay Plans vs Subscriptions - Complete Guide

## Understanding the Difference

### 📋 **Plans** (Templates)
- **What**: Reusable templates that define billing details
- **Created**: Once in Razorpay Dashboard (you've already done this!)
- **Contains**:
  - Plan Name
  - Plan Description
  - Billing Frequency (e.g., Every 1 Month)
  - Billing Amount (e.g., ₹100.00)
  - Currency (INR)

**Example Plans:**
- `plan_RU6UHkpXz37JZm` - ₹100/month
- `plan_RU6XP0WyHlHqe3` - ₹500/month

### 🎫 **Subscriptions** (Active Customer Subscriptions)
- **What**: Active subscriptions created FROM plans when customers subscribe
- **Created**: Automatically by your app when customer clicks "Subscribe" button
- **Contains**:
  - Which Plan the customer chose
  - Which Customer is subscribed
  - Start Date
  - Total Billing Cycles
  - Next Due Date
  - Status (pending, active, canceled)

**Example Subscription:**
- Customer: `cust_RZdghFYsb7u8JZ`
- Plan: `plan_RU6UHkpXz37JZm`
- Start Date: Today
- Next Due: Next month (30 days from start)
- Status: `active` or `pending`

---

## How It Works in Your App

### ✅ **AUTOMATIC FLOW (Recommended - What You Should Use)**

1. **Customer clicks "Subscribe" on your pricing page**
   ```
   /pricing → User clicks "Subscribe to Pro Plan"
   ```

2. **Your app automatically:**
   - Creates a Razorpay Customer (if doesn't exist)
   - Creates a Subscription FROM the Plan
   - Sets Start Date = Immediate (today)
   - Sets Total Count = 12 billing cycles (12 months)
   - Redirects customer to Razorpay payment page

3. **After customer pays:**
   - Razorpay sends webhook to your app
   - Your app updates subscription status to `active`
   - Next Due Date is automatically calculated

**Code Location:**
- Frontend: `components/pricing/PricingSection.tsx` (lines 22-40)
- Backend: `app/api/razorpay/create-subscription/route.ts`
- Helper: `lib/razorpay.ts` → `createRazorpaySubscription()`

---

## Manual Subscription Creation (Razorpay Dashboard)

### 📝 **When to Use:**
- Testing subscriptions manually
- Creating subscriptions for specific customers outside your app
- Debugging subscription creation issues

### 🖥️ **Subscription Form Fields Explained:**

#### 1. **Select Plan** (Required)
- Choose which plan template to use
- Dropdown shows all your created plans

#### 2. **Select Customer** (Required)
- Choose which customer this subscription is for
- If customer doesn't exist, create it first in "Customers" section

#### 3. **Start Date** (Required)
- Format: `DD-MM-YYYY`
- Options:
  - **Immediate**: Subscription starts with first payment (most common)
  - **Future Date**: Subscription starts on specific date (useful for trial periods)

**Example:**
- Today: `01-02-2025`
- Immediate: Subscription starts today
- Future: `15-02-2025` → Subscription starts on 15th

#### 4. **Total Count** (Required)
- Number of billing cycles to charge
- Example:
  - `12` = 12 months of billing
  - `24` = 2 years of billing
  - `0` or empty = Indefinite (bills forever until canceled)

#### 5. **Offer** (Optional)
- Discount coupons or offers
- Can provide discounts to customers
- Only if you've created offers in Razorpay

#### 6. **Internal Notes** (Optional)
- Notes for your reference
- Not visible to customers

---

## What Happens After Subscription Creation

### 🎯 **Immediate Actions:**

1. **Subscription Created in Razorpay**
   - Status: `created` or `pending`
   - Subscription ID generated: `sub_RaXXXXX`
   - Short URL generated: `https://rzp.io/rzp/XXXXX`

2. **If Start Date = Immediate:**
   - Customer redirected to payment page immediately
   - After payment → Status becomes `active`
   - Next Due Date = Start Date + Billing Frequency

3. **If Start Date = Future:**
   - Subscription stays `pending` until start date
   - On start date → Razorpay charges customer
   - Status becomes `active`

### 📊 **Database Updates:**

Your app automatically stores:
- ✅ Subscription ID (`razorpay_subscription_id`)
- ✅ Plan ID (`plan` field)
- ✅ Customer ID (`razorpay_customer_id`)
- ✅ Status (`pending`, `active`, `canceled`)
- ✅ Start Date (`current_period_start`)
- ✅ End Date (`current_period_end`)
- ✅ **Next Due Date** (`next_due_date`) ← **This is what you need!**

### 🔔 **Webhook Updates:**

When subscription events occur:
- `subscription.activated` → Updates status to `active`
- `subscription.charged` → Updates status + next due date
- `subscription.cancelled` → Updates status to `canceled`

---

## Why "Next Due on" Shows "--" (Empty)

### ❌ **Problem:**
If you see `--` in "Next Due on" column, it means:
1. The `next_due_date` column doesn't exist in database, OR
2. Existing subscriptions were created before we added this feature

### ✅ **Solution:**

#### Step 1: Add the Column
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_due_date 
ON subscriptions(next_due_date);
```

#### Step 2: Sync Existing Subscriptions
After running SQL, call this API to update existing subscriptions:
```bash
POST /api/admin/sync-subscriptions
```

Or create a button in admin panel:
```typescript
// Add to your admin panel
<Button onClick={async () => {
  const response = await fetch('/api/admin/sync-subscriptions', {
    method: 'POST',
  });
  const data = await response.json();
  toast({ title: `Synced ${data.synced} subscriptions` });
}}>
  Sync Subscriptions from Razorpay
</Button>
```

#### Step 3: New Subscriptions
- All NEW subscriptions created through your app will automatically have `next_due_date` populated
- No manual action needed!

---

## Summary: What You Should Do

### ✅ **For New Customers:**
1. **Nothing!** Let your app handle it automatically
2. Customer clicks "Subscribe" → App creates subscription → Customer pays → Done!

### ✅ **For Existing Subscriptions (with `--` in Next Due):**
1. Run SQL script to add `next_due_date` column
2. Call `/api/admin/sync-subscriptions` to sync from Razorpay
3. Done! All subscriptions will have next due dates

### ❓ **Manual Creation (Only if needed):**
- Use Razorpay Dashboard only for testing/debugging
- Fill in:
  - Plan: Select your plan
  - Customer: Select or create customer
  - Start Date: Choose Immediate or Future date
  - Total Count: Number of billing cycles (e.g., 12 for 12 months)
  - Click "Create Subscription"

---

## Key Takeaways

1. ✅ **Plans** = Templates (already created ✓)
2. ✅ **Subscriptions** = Active customer subscriptions (created automatically by your app ✓)
3. ✅ **You DON'T need to manually create subscriptions** - Your app does it!
4. ✅ **Next Due Date** is calculated automatically from Razorpay's `charge_at` or `current_end` fields
5. ✅ **Run SQL script** to add column, then **sync existing subscriptions** once

---

## Need Help?

If `next_due_date` is still empty after:
- ✅ Running SQL script
- ✅ Syncing subscriptions
- ✅ Creating new subscription

Check:
1. Razorpay subscription response in console logs
2. Webhook is receiving events correctly
3. Database column exists and has data

The code already handles everything - you just need to:
1. Add the database column
2. Sync existing subscriptions once
3. Enjoy automatic next due date tracking! 🎉

