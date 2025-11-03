# Fix: "Hosted page is not available" Error

## 🔍 **The Issue**

When customers try to subscribe, they see:
```
Error: Hosted page is not available. Please contact the merchant for further details.
```

**URL showing error:** `https://rzp.io/rzp/XXXXX`

---

## ❌ **Root Cause**

**Razorpay's "Hosted Checkout" feature is NOT enabled** in your Razorpay account.

This is a **Razorpay account setting**, not a code issue.

---

## ✅ **Solution: Enable Hosted Checkout**

### **Step 1: Login to Razorpay Dashboard**

1. Go to: https://dashboard.razorpay.com/
2. Login with your Razorpay account

### **Step 2: Navigate to Hosted Checkout Settings**

**Option A: Direct Path**
1. Click **"Settings"** (left sidebar)
2. Click **"Subscriptions"**
3. Click **"Hosted Checkout"**

**Option B: Via Subscriptions**
1. Click **"Subscriptions"** (left sidebar)
2. Click **"Settings"** or gear icon
3. Look for **"Hosted Checkout"** or **"Checkout Settings"**

### **Step 3: Enable Hosted Checkout**

1. Find the toggle/switch for **"Hosted Checkout"**
2. Toggle it **ON** / **Enable** it
3. Save settings

### **Step 4: Wait for Activation**

- Usually activates within **few minutes**
- Sometimes takes **24-48 hours** (if requires Razorpay team approval)
- You'll see confirmation in dashboard

---

## 📧 **If Hosted Checkout Setting Not Visible**

### **Contact Razorpay Support**

If you can't find the "Hosted Checkout" setting:

1. **Via Dashboard:**
   - Razorpay Dashboard → **"Support"** → **"Contact Support"**
   - Create new ticket

2. **Via Email:**
   - Email: **support@razorpay.com**
   - Subject: "Enable Hosted Checkout for Subscriptions"

3. **Via Phone:**
   - Check Razorpay dashboard for support phone number
   - Call support during business hours

### **Message to Send:**

```
Subject: Enable Hosted Checkout Feature for Subscriptions

Hello Razorpay Support Team,

I need to enable "Hosted Checkout" feature for my subscription plans.

Currently, when I create subscriptions, the short_url (https://rzp.io/rzp/XXXXX) 
shows "Hosted page is not available" error, and customers cannot complete payments.

Account Details:
- Merchant ID: [Your Merchant ID from dashboard]
- Account Email: [Your Email]
- Account Name: [Your Business Name]

Please enable the "Hosted Checkout" feature for subscriptions so customers can 
complete subscription payments through the hosted payment page.

I have:
- ✅ Created subscription plans
- ✅ Set up API keys
- ✅ Integrated subscription creation
- ❌ Missing: Hosted Checkout enabled

Thank you for your assistance!

Best regards,
[Your Name]
```

---

## 🔍 **How to Verify It's Fixed**

### **Test After Enabling:**

1. **Create a Test Subscription:**
   - Go to your `/pricing` page
   - Click "Subscribe" on any plan
   - Should redirect to Razorpay payment page (NOT error)

2. **Expected Result:**
   - ✅ Redirects to `https://rzp.io/rzp/XXXXX`
   - ✅ Payment page loads successfully
   - ✅ Customer can enter payment details
   - ✅ Payment can be completed

3. **If Still Shows Error:**
   - Wait 24-48 hours (activation can take time)
   - Check Razorpay dashboard for activation status
   - Contact Razorpay support again if still not working

---

## 📋 **Summary**

### **The Problem:**
- "Hosted page is not available" = Hosted Checkout not enabled
- Customers cannot complete subscription payments
- This is a Razorpay account setting issue, not code

### **The Fix:**
1. ✅ Enable "Hosted Checkout" in Razorpay Dashboard
   - Settings → Subscriptions → Hosted Checkout → Enable
2. ✅ OR Contact Razorpay Support if setting not visible
3. ✅ Wait for activation (few minutes to 48 hours)

### **After Fix:**
- ✅ Subscription checkout URLs will work
- ✅ Customers can complete payments
- ✅ Everything works automatically

---

## ⚠️ **Important Notes**

1. **Not a Code Issue:**
   - Your code is correct ✓
   - Subscription creation works ✓
   - Only missing: Hosted Checkout enabled

2. **Requires Razorpay Action:**
   - You must enable it in Razorpay dashboard
   - OR request Razorpay support to enable it
   - Cannot be fixed from your code

3. **Once Enabled:**
   - All subscriptions (existing and new) will work
   - Checkout URLs will load successfully
   - Payments can be completed

---

## ✅ **Quick Checklist**

- [ ] Login to Razorpay Dashboard
- [ ] Navigate to: Settings → Subscriptions → Hosted Checkout
- [ ] Enable "Hosted Checkout" toggle
- [ ] OR Contact Razorpay Support if setting not visible
- [ ] Wait for activation (few minutes to 48 hours)
- [ ] Test: Create subscription → Check hosted page loads
- [ ] Done! 🎉

---

## 🚀 **You're Almost There!**

1. ✅ Code is correct
2. ✅ Subscriptions are created
3. ⬜ Enable Hosted Checkout in Razorpay (DO THIS)
4. ✅ Everything will work!

**This is the LAST step to fix the hosted page error!** Once enabled, all subscription checkouts will work perfectly! 🎉



