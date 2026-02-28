dddd# ✅ Coupon System Setup Checklist

## 🎯 What Was Done

✅ **Coupon Code System** - Fully implemented with:
- Coupon validation API
- Coupon generation after payment
- 10% discount application
- Usage tracking in database

✅ **Frontend Updates**:
- Coupon input field on checkout button
- Real-time discount validation
- Applied discount display
- Enhanced success page with generated coupon

✅ **Database Schema**:
- `coupon_codes` table for storing codes
- `coupon_usage_logs` table for tracking usage
- RLS policies for security

✅ **Success Page Enhanced**:
- Shows payment confirmation
- Displays discount breakdown
- Shows generated coupon code
- Copy-to-clipboard functionality
- Share template for referrals

---

## 🚀 Setup Steps (Do These!)

### Step 1: Database Setup (Required)
1. Open Supabase SQL Editor
2. Copy all SQL from `docs/COUPON_CODES_TABLE.sql`
3. Paste and execute it
4. ✅ Verify tables exist:
   - `coupon_codes`
   - `coupon_usage_logs`

### Step 2: Fix Environment Variables (Important!)
Update your `.env.local`:

```env
# Existing
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# IMPORTANT: Add this!
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

###  Step 3: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then:
npm run dev
```

### Step 4: Test the System

**Test Coupon Validation:**
1. Go to trek checkout
2. Enter code: `TEST123` (won't exist, should show error)
3. See error message ✅

**Test Coupon Generation:**
1. Complete a payment
2. See success page
3. Look for "Your Exclusive Coupon" section
4. Copy coupon code ✅

**Test Coupon Usage:**
1. Logout and create new account
2. Go to book same trek
3. Apply previously generated coupon
4. See 10% discount applied ✅

---

## 🔧 Fix for Localhost Redirect Error

The error you saw ("localhost refused to connect") is because:

**❌ Problem:**
```
callback_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/success`
```

If `NEXT_PUBLIC_APP_URL` is not set, it defaults to `http://localhost:3000`.

**✅ Solution:**
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then restart dev server:
```bash
npm run dev
```

This ensures the success page callback URL is correct!

---

## 📋 Files Changed

### ✨ New Files Created:
- `app/api/coupon/validate/route.ts` - Validates coupons
- `app/api/coupon/generate/route.ts` - Generates after payment
- `docs/COUPON_CODES_TABLE.sql` - Database schema
- `COUPON_SYSTEM_GUIDE.md` - Full documentation

### ✏️ Files Modified:
- `app/api/payment/create-order/route.ts` - Added coupon support
- `components/CheckoutButton.tsx` - Added coupon input UI
- `app/success/page.tsx` - Enhanced with coupon display
- `utils/razorpay/client.ts` - Cleaned up

### ❌ Files to Delete (Obsolete):
- `components/RazorpayPaymentButton.tsx` - Duplicate component
- `app/api/payment/verify/route.ts` - Not needed for hosted checkout
- `global.d.ts` - Not needed (Razorpay typings)

---

## 🎉 How It Works Now

### User Checkout Flow:
```
1. User clicks "Pay ₹5,000"
   ↓
2. User enters coupon code (optional)
   ↓
3. Backend validates coupon → /api/coupon/validate
   ↓
4. If valid → Shows 10% discount
   ↓
5. User completes payment with NEW discounted amount
   ↓
6. Razorpay redirects to /success page
   ↓
7. Backend generates NEW coupon → /api/coupon/generate
   ↓
8. User sees coupon code with copy button
   ↓
9. User shares coupon with friends → They get 10% off!
```

---

## 💡 Useful SQL Queries

### View All Active Coupons:
```sql
SELECT code, discount_percentage, trek_ids, created_at 
FROM coupon_codes 
WHERE is_active = true 
ORDER BY created_at DESC;
```

### View Coupon Usage:
```sql
SELECT 
  c.code,
  COUNT(*) as times_used,
  SUM(l.discount_amount) as total_savings
FROM coupon_codes c
LEFT JOIN coupon_usage_logs l ON c.id = l.coupon_id
GROUP BY c.code
ORDER BY times_used DESC;
```

### Deactivate A Coupon:
```sql
UPDATE coupon_codes 
SET is_active = false 
WHERE code = 'TREK...';
```

---

## ⚠️ Important Notes

1. **Coupon Code Format:** `TREK` + Trek prefix + Random hex
   - Example: `TREKEVER1A2B3C`
   - All stored as UPPERCASE

2. **Discount is Always 10%**
   - Configurable in database if needed
   - Set in `coupon_codes.discount_percentage` column

3. **Coupon Expiry:** 1 year from generation
   - Configurable in `coupon_codes.estimated_expiry` column

4. **Usage Tracking:** All applied coupons logged with:
   - Which user used it
   - Which trek
   - Razorpay payment ID
   - Discount amount given

5. **Security:**
   - Coupon codes are validated on backend (not frontend)
   - RLS policies prevent unauthorized access
   - Discount applied BEFORE payment to Razorpay

---

## 🆘 Troubleshooting

### ❌ "Payment service is unavailable"
```
Solution:
1. Check .env.local has RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET
2. Restart dev server
3. Check server logs for errors
```

### ❌ "localhost refused to connect"
```
Solution:
1. Add NEXT_PUBLIC_APP_URL=http://localhost:3000 to .env.local
2. Restart dev server with: npm run dev
3. Verify dev server is actually running
```

### ❌ Coupon code not validating
```
Solution:
1. Check code exists in database
2. Verify code is UPPERCASE in database
3. Check if coupon is_active = true
4. Check if expiry date is in future
5. Check trek_ids includes this trek
```

### ❌ Success page not showing coupon
```
Solution:
1. Check browser console (F12) for errors
2. Verify payment was marked as successful
3. Check if /api/coupon/generate returned successfully
4. Verify sessionStorage is working
```

---

## ✅ Testing Checklist

- [ ] Database tables created (coupon_codes, coupon_usage_logs)
- [ ] .env.local has NEXT_PUBLIC_APP_URL
- [ ] Dev server restarted
- [ ] Can open checkout page
- [ ] Can enter coupon code
- [ ] Can click "Apply" button
- [ ] Invalid code shows error
- [ ] Can complete payment
- [ ] Success page shows coupon code
- [ ] Can copy coupon code
- [ ] New user can use coupon for 10% discount

---

## 📞 Next Support

For issues:
1. Check **Troubleshooting** section above
2. Look at server logs: `npm run dev` terminal output
3. Check browser console: F12 → Console tab
4. Verify database tables in Supabase dashboard

---

**🎉 You're all set! Your coupon system is ready to go!**
