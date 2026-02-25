# Remove Localhost - Production Setup Guide

## The Problem

After payment, the page was redirecting to `localhost:3000`, which is:
- ❌ Not a real website URL
- ❌ Only works on your local computer
- ❌ Not accessible to users

## The Solution

### For Development (Testing Locally)

In **development mode** (localhost), Razorpay's callback won't work because:
- Razorpay's servers can't reach your local machine
- Therefore, no automatic redirect happens
- **This is normal and expected**

**Development Flow:**
1. User clicks "Pay ₹5,000" 
2. Redirects to Razorpay payment page
3. User completes payment on Razorpay
4. Razorpay shows payment success message
5. **User manually navigates to `/success`** or clicks "Return to Website"
6. Payment confirmation page loads with coupon

**Note:** The app stores payment info in browser's sessionStorage, so `/success` page will work even without Razorpay callback.

---

### For Production (Real Website)

When deploying to production with a real domain:

#### Step 1: Update `.env.production`

```env
# Production environment variables
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx  # Live mode key
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com         # Your real domain!
```

#### Step 2: Deploy to Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel/hosting
vercel deploy --prod
```

#### Step 3: Update Razorpay Dashboard

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Add webhook endpoint:
   ```
   https://yourdomain.com/api/webhooks/razorpay
   ```
3. Subscribe to events:
   - `payment.authorized`
   - `payment.failed`
   - `payment_link.completed`

---

## What Changed in the Code

### `app/api/payment/create-order/route.ts`

**Before:**
```typescript
callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/success`
```

**After:**
```typescript
// Only include callback_url if we have a production domain
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const isProduction = appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1");

if (isProduction) {
  paymentLinkConfig.callback_url = `${appUrl}/success`;
}
```

**Result:** 
- ✅ Localhost is NOT hardcoded
- ✅ Callback only used in production
- ✅ Development works without callback

---

## Environment Variables Explained

### For Local Development
```env
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx        # Test mode
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### For Vercel/Production
```env
# Set in Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://yourdomain.com        # Your actual domain!
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx        # Live mode key
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### For Custom Server
```env
# .env.production (if deploying to custom server)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
# Other vars...
```

---

## Development vs Production Comparison

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Domain** | `localhost:3000` | `yourdomain.com` |
| **Razorpay Mode** | Test (rzp_test_) | Live (rzp_live_) |
| **Callback URL** | ❌ Not used | ✅ Used |
| **Payment Redirect** | Manual navigation | Automatic redirect |
| **Coupon Generation** | Via sessionStorage | Via API |
| **Payment Confirmation** | Manual navigate to /success | Auto-redirect to /success |

---

## Testing Locally

Since callback won't work in development, here's how to test:

### Option 1: Manual Testing (Simplest)
```
1. npm run dev
2. Go to http://localhost:3000/treks
3. Click "Pay ₹5,000"
4. Complete payment with test card: 4111 1111 1111 1111
5. On Razorpay success page, click "Return to Website"
6. Manually navigate to http://localhost:3000/success
7. See confirmation + coupon code
```

### Option 2: Use ngrok (Auto-redirect in Dev)
```bash
# Install ngrok
npm install -g ngrok

# In terminal 1: Start dev server
npm run dev

# In terminal 2: Expose localhost to web
ngrok http 3000

# You'll get: https://xxxx-xx-xxx-xxx.ngrok.io

# Set environment variable:
NEXT_PUBLIC_APP_URL=https://xxxx-xx-xxx-xxx.ngrok.io

# Now payment will auto-redirect to /success!
```

---

## Setting Up Your Production Domain

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically
5. Get free domain or use custom domain
```
https://yourproject.vercel.app
```

### Option 2: AWS / GCP / Custom Server
1. Deploy your Next.js app
2. Point domain to server
3. Set environment variables
4. Use HTTPS certificate (Let's Encrypt free)

### Option 3: Your Own Server
```bash
# Build
npm run build

# Start
NODE_ENV=production npm start

# Use nginx/Apache as reverse proxy
# Enable HTTPS with Let's Encrypt
```

---

## Checklist for Production

- [ ] Have a real domain name (e.g., himalayan-runners.com)
- [ ] Have SSL certificate (HTTPS)
- [ ] Updated `.env` variables in production
- [ ] Using `rzp_live_` keys (not `rzp_test_`)
- [ ] `NEXT_PUBLIC_APP_URL` set to your domain
- [ ] Tested payment flow with real card (small amount)
- [ ] Razorpay webhooks configured
- [ ] Error handling & monitoring set up
- [ ] Database backups configured

---

## Troubleshooting

### ❌ Still seeing localhost in URL?
```
1. Clear browser cache (Ctrl+Shift+Del)
2. Check .env variables are set
3. Restart dev server: npm run dev
4. Check if NEXT_PUBLIC_APP_URL is being used
```

### ❌ Payment not redirecting after completing?
```
In development: This is normal, manually navigate to /success

In production:
1. Check NEXT_PUBLIC_APP_URL is set to your domain
2. Check if domain is accessible (not firewall blocked)
3. Check Razorpay webhook configuration
4. Check server logs for errors
```

### ❌ Localhost URL in production?
```
1. Check environment variables in your hosting platform
2. Rebuild and redeploy
3. Clear CDN cache if using one
4. Verify NEXT_PUBLIC_APP_URL doesn't have localhost
```

---

## File Changes Made

- ✏️ `app/api/payment/create-order/route.ts` - Removed localhost hardcoding
- ✏️ `components/CheckoutButton.tsx` - Added dev mode logging
- ✏️ `app/success/page.tsx` - Better dev/prod detection
- 📋 `.env.example` - Documentation for all variables

---

## Next Steps

1. ✅ Test locally by manually navigating to /success after payment
2. ✅ When ready for production, get a domain name
3. ✅ Deploy to Vercel or your own server
4. ✅ Update environment variables with real domain
5. ✅ Switch to Razorpay Live mode keys
6. ✅ Test with real payment

---

**Summary:** The app now:
- ✅ Has NO hardcoded localhost
- ✅ Works in development without automatic redirect (normal)
- ✅ Will auto-redirect in production when domain is set
- ✅ Is production-ready for any domain!
