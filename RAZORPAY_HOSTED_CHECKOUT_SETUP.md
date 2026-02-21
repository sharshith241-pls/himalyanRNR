# Razorpay Hosted Checkout Setup Guide

## Changes Made

Your Razorpay integration has been updated to use **Hosted Checkout (Payment Links)** instead of the modal approach. This is more reliable and doesn't require loading the Razorpay JavaScript library.

### Key Changes:

1. **Backend API** (`/api/payment/create-order`)
   - Now creates **Payment Links** using `razorpayInstance.paymentLink.create()`
   - Returns `short_url` - a Razorpay-hosted checkout page
   - No longer needs to verify payments (Razorpay handles it)

2. **Frontend Component** (`CheckoutButton.tsx`)
   - Simplified to just fetch the payment link
   - Redirects user directly to Razorpay hosted page
   - No modal, no additional JavaScript loading

3. **Client Utilities** (`utils/razorpay/client.ts`)
   - Simplified to only support payment link creation
   - Added `redirectToPayment()` function for easier integration

4. **Removed Components**
   - `RazorpayPaymentButton.tsx` - now duplicate and unused
   - Manual script loading for Razorpay JS library

---

## Required Environment Variables

Add these to your `.env.local` file:

### Backend Environment Variables (NEVER expose to frontend)
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Frontend Environment Variables
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Application Configuration
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Where to Find These Values

1. Visit **Razorpay Dashboard**: https://dashboard.razorpay.com
2. Go to **Settings** → **API Keys**
3. Make sure you're in **Test Mode** (toggle at top right)
4. Copy:
   - **Key ID** → Use for both backend and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → Use for backend `RAZORPAY_KEY_SECRET` only

⚠️ **IMPORTANT**: Never commit `.env.local` to Git. Add it to `.gitignore`:
```
.env.local
.env.*.local
```

---

## How It Works Now

1. User clicks **"Pay ₹5,000"** button
2. Frontend sends: `trekId`, `amount`, `userEmail`, `userName` to backend
3. Backend creates a **Payment Link** in Razorpay
4. Frontend receives `short_url` (e.g., `rzp.io/abc123`)
5. User is redirected to Razorpay's hosted checkout page
6. After payment, Razorpay redirects back to `/success` page
7. ✅ Payment complete!

---

## Testing

### Test Credit Cards (in Test Mode)
- **Success**: `4111 1111 1111 1111` (Visa)
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Common Issues

**Error: "Payment service is unavailable"**
- ❌ Environment variables not set
- ✅ Check `.env.local` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

**Blank payment page after redirect**
- ❌ Razorpay Key ID not valid
- ✅ Make sure it starts with `rzp_test_` (test mode)

**Payment link not loading**
- ❌ Network issue
- ✅ Check browser console, restart dev server

---

## Next Steps

1. ✅ Verify environment variables in `.env.local`
2. ✅ Test with Razorpay test cards
3. ✅ Set up success/callback handling on `/success` page
4. ✅ Remove `RazorpayPaymentButton.tsx` component
5. ✅ Delete `/app/api/payment/verify/route.ts` (no longer needed for hosted checkout)

---

## Files Modified

- ✏️ `app/api/payment/create-order/route.ts` - Now creates payment links
- ✏️ `components/CheckoutButton.tsx` - Simplified for hosted checkout
- ✏️ `utils/razorpay/client.ts` - Streamlined utilities
- ✨ `.env.example` - Created for documentation
- ❌ `components/RazorpayPaymentButton.tsx` - Should be deleted (no longer used)

---

## Support

For Razorpay documentation:
- https://razorpay.com/docs/payments/payment-links/

For issues:
- Check server logs: `npm run dev` output
- Check browser console: F12 → Console tab
- Verify credentials at: https://dashboard.razorpay.com/settings/api-keys
