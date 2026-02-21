# Coupon System Implementation

## Overview

The coupon system allows:
1. ✅ Users to apply coupon codes at checkout to get 10% discount
2. ✅ Generate unique coupon codes after successful trek payment
3. ✅ Share coupons with friends to earn referral benefits
4. ✅ Track coupon usage and discount amounts

---

## Database Setup

### Step 1: Run SQL Migration

Execute the SQL from [docs/COUPON_CODES_TABLE.sql](../docs/COUPON_CODES_TABLE.sql) in your Supabase SQL Editor:

```sql
-- Creates tables:
-- 1. coupon_codes - stores coupon codes and their settings
-- 2. coupon_usage_logs - tracks when/how coupons are used
```

### Step 2: Set RLS Policies (if needed)

The SQL file includes RLS policies, but verify they're enabled:
- `coupon_codes` - Anyone can view active coupons
- `coupon_usage_logs` - Users can view their own usage, admins can view all

---

## API Endpoints

### 1. Validate Coupon
**POST** `/api/coupon/validate`

Validates and calculates discount for a coupon code.

**Request:**
```json
{
  "couponCode": "TREK1234ABC",
  "amount": 5000,
  "trekId": "everest-basecamp"
}
```

**Response (Success):**
```json
{
  "success": true,
  "coupon": {
    "id": "uuid",
    "code": "TREK1234ABC",
    "discountPercentage": 10,
    "discountAmount": 500,
    "finalAmount": 4500,
    "originalAmount": 5000
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid or inactive coupon code"
}
```

---

### 2. Generate Coupon After Payment
**POST** `/api/coupon/generate`

Generates a unique coupon code after successful payment.

**Request:**
```json
{
  "userId": "user-uuid",
  "trekId": "everest-basecamp",
  "paymentId": "pay_xxxxx",
  "amount": 5000
}
```

**Response:**
```json
{
  "success": true,
  "coupon": {
    "code": "TREKEVER1A2B3C",
    "discountPercentage": 10,
    "validFor": "everest-basecamp",
    "expiryDate": "2027-02-21T10:30:00Z"
  }
}
```

**Coupon Code Format:**
- `TREK` + Trek prefix (4 chars) + Random hex (6 chars)
- Example: `TREKEVER1A2B3C`
- Format in database: uppercase

---

## Flow Diagram

```
User Checkout Flow:
┌─────────────────┐
│ Checkout Page   │
└────────┬────────┘
         │
         ├─── User enters coupon code (optional)
         │
         ├─ /api/coupon/validate 
         │   └─ Check code validity, expiry, max uses
         │      └─ Calculate discount (10%)
         │
         └─ /api/payment/create-order
            ├─ Include coupon code in request
            ├─ Apply discount to amount
            └─ Create Razorpay payment link
               └─ Redirect to payment page

Payment Success Flow:
┌──────────────────────┐
│ Razorpay Success URL │
│ /success?payment_id= │
└──────────┬───────────┘
           │ Razorpay redirects here after payment
           │
           ├─ /success page loads
           │
           ├─ /api/coupon/generate
           │  ├─ Generate unique coupon code
           │  ├─ Store in coupon_codes table
           │  └─ Log usage in coupon_usage_logs
           │
           └─ Display coupon to user
              └─ Allow copy & share
```

---

## Frontend Integration

### CheckoutButton Component

```tsx
<CheckoutButton
  trekId="everest-basecamp"
  trekTitle="Everest Base Camp"
  amount={5000}
  userEmail="user@example.com"
  userName="John Doe"
  userId={userId} // Optional, for coupon generation
/>
```

**Features:**
- ✅ Coupon code input field
- ✅ "Apply" button to validate
- ✅ Shows discount if coupon is valid
- ✅ Updates final amount in real-time
- ✅ Error handling for invalid codes

---

## Success Page

After payment, users see:
- ✅ Payment confirmation with ✅ checkmark
- ✅ Booking details with original/final amount
- ✅ Discount breakdown
- ✅ **Generated coupon code** (if this is their first trek)
- ✅ Copy coupon button
- ✅ Share text template
- ✅ Expiry date and validity info

---

## Key Features

### 1. Coupon Code Generation
- Generated after EVERY trek payment
- Format: `TREK[4-char trek prefix][6 random hex chars]`
- Example: `TREKEVERBF2A9F`
- Stored in database with creation timestamp

### 2. Coupon Validation
- ✅ Code exists and is active
- ✅ Not expired
- ✅ Haven't reached max uses
- ✅ Valid for specific trek (if restricted)

### 3. Discount Application
- Always **10% off**
- Configurable in database (`discount_percentage` column)
- Applied in payment link before Razorpay

### 4. Usage Tracking
- Every coupon usage logged in `coupon_usage_logs`
- Track which user used which coupon
- Track payment ID for reference
- Track discount amount applied

---

## Database Schema Reference

### `coupon_codes` Table
```sql
id UUID - Primary key
code VARCHAR(50) - Unique coupon code (e.g., TREKEVERBF2A9F)
discount_percentage DECIMAL - % discount (default: 10%)
created_by UUID - User who earned this coupon
created_at TIMESTAMP - When coupon was generated
estimated_expiry TIMESTAMP - When coupon expires (1 year)
is_active BOOLEAN - Can this coupon be used?
max_uses INTEGER - Max times this code can be used
current_uses INTEGER - Current usage count
trek_ids TEXT[] - Valid only for these treks (NULL = all)
notes TEXT - Internal notes (e.g., payment reference)
```

### `coupon_usage_logs` Table
```sql
id UUID - Primary key
coupon_id UUID - Which coupon was used
user_id UUID - Who used it
payment_id VARCHAR - Razorpay payment ID
trek_id VARCHAR - Which trek
discount_amount DECIMAL - How much they saved
original_amount DECIMAL - Pre-discount price
final_amount DECIMAL - Post-discount price
created_at TIMESTAMP - When used
```

---

## Testing

### Manual Test Scenarios

**Scenario 1: Apply Valid Coupon**
1. Go to trek checkout
2. Enter a valid coupon code (test one or generate manually)
3. Click "Apply"
4. Verify discount shows
5. Complete payment
6. Verify new coupon generated on success page

**Scenario 2: Invalid Coupon**
1. Enter invalid code
2. Click "Apply"
3. See error: "Invalid or inactive coupon code"

**Scenario 3: Expired Coupon**
1. Create old coupon with past expiry
2. Try to apply
3. See error: "Coupon code has expired"

**Scenario 4: Max Uses Reached**
1. Create coupon with max_uses: 2
2. Apply it twice
3. Try 3rd time
4. See error: "Coupon code has reached maximum uses"

---

## Admin Operations

### Create Manual Coupon (for promotions)

Insert directly in Supabase SQL Editor:
```sql
INSERT INTO coupon_codes (
  code, 
  discount_percentage, 
  created_by, 
  max_uses, 
  trek_ids, 
  notes
)
VALUES (
  'WELCOME10',           -- Code
  10,                    -- 10% discount
  (SELECT id FROM auth.users LIMIT 1), -- Admin user
  NULL,                  -- Unlimited uses
  ARRAY['everest-basecamp', 'kilimanjaro'],  -- Valid for these treks
  'Welcome promotion - valid for 30 days'
);
```

### Deactivate Coupon
```sql
UPDATE coupon_codes 
SET is_active = false 
WHERE code = 'TREKEVERBF2A9F';
```

### Check Usage Stats
```sql
SELECT 
  code,
  COUNT(*) as total_uses,
  SUM(discount_amount) as total_discount_given
FROM coupon_codes c
JOIN coupon_usage_logs l ON c.id = l.coupon_id
GROUP BY code
ORDER BY total_uses DESC;
```

---

## Environment Variables

No new environment variables needed! Uses existing:
- `NEXT_PUBLIC_APP_URL` - For callback URL
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - For payment

---

## Troubleshooting

**Issue: Coupon code not being generated after payment**
- Check if user authentication is working
- Verify `/api/coupon/generate` endpoint is accessible
- Check server logs for errors
- Ensure `coupon_codes` table exists in Supabase

**Issue: "RLS policy violation" when generating coupon**
- Verify RLS is enabled on `coupon_codes` table
- Check admin user exists and has correct permissions
- Run RLS policy setup from SQL file

**Issue: Discount not being applied**
- Check if coupon code exists and is_active = true
- Verify coupon hasn't expired
- Check max_uses hasn't been reached
- Verify trek_ids includes the trek (if restricted)

**Issue: Success page not showing coupon**
- Check if sessionStorage is working
- Verify `/success` URL matches callback_url
- Check browser console for errors
- Verify payment ID is being passed correctly

---

## Files Modified/Created

- ✨ `docs/COUPON_CODES_TABLE.sql` - Database schema
- ✨ `app/api/coupon/validate/route.ts` - Validate coupons
- ✨ `app/api/coupon/generate/route.ts` - Generate after payment
- ✏️ `app/api/payment/create-order/route.ts` - Updated to support coupons
- ✏️ `components/CheckoutButton.tsx` - Added coupon input
- ✏️ `app/success/page.tsx` - Display coupon & allow sharing
- ✏️ `utils/razorpay/client.ts` - Simplified (no verify needed)

---

## Next Steps

1. ✅ Run the SQL migration from `docs/COUPON_CODES_TABLE.sql`
2. ✅ Restart your dev server
3. ✅ Test checkout with and without coupon
4. ✅ Complete a payment to see coupon generation
5. ✅ Share generated coupon with another user and test

---

# Summary

The coupon system is now fully integrated! Users get:
- 🎉 Unique coupon after each trek booking
- 💰 10% discount when using coupons
- 📤 Easy sharing with copy-to-clipboard button
- 📊 All discount tracking in database
