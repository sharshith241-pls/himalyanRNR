# 🚨 FIX: Deployed Website Redirecting to Localhost

## The Problem

Your deployed website is redirecting to `localhost:3000/success?razorpay_payment_id=...`

This happens because: **`NEXT_PUBLIC_APP_URL` environment variable is not set on your deployed website**

---

## The Fix (Required Action)

### Step 1: Find Your Deployment Platform

Where did you deploy your website? 

- **Vercel** → Go to Vercel Dashboard
- **AWS** → Go to AWS Console
- **Netlify** → Go to Netlify Dashboard
- **Your own server** → SSH into server

### Step 2: Add Environment Variable

Add this environment variable to your deployed website:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Replace `yourdomain.com` with your actual deployed domain!**

### Step 3: Redeploy

After setting the environment variable, **redeploy** your website:

---

## Platform-Specific Instructions

### 🔷 If You're Using Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://yourdomain.com` (your actual domain)
5. Click **Save**
6. **Redeploy:** Go to **Deployments** → Click **Redeploy** on latest build
   
✅ Done!

---

### 🔷 If You're Using AWS

1. Go to your **EC2 instance** or **App Runner**
2. Edit environment variables:
   ```bash
   export NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
3. Rebuild and redeploy:
   ```bash
   npm run build
   npm start
   ```

---

### 🔷 If You're Using Netlify

1. Go to https://app.netlify.com
2. Select your site
3. **Site Settings** → **Build & Deploy** → **Environment**
4. **Edit variables** → Add:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://yourdomain.com`
5. **Trigger a new deploy**

---

### 🔷 If You're Using Your Own Server

1. SSH into your server:
   ```bash
   ssh user@yourdomain.com
   ```

2. Edit `.env` or `.env.production`:
   ```bash
   nano .env.production
   ```

3. Add:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

4. Rebuild and restart:
   ```bash
   npm run build
   npm start
   ```

---

## What This Fixes

**Before (❌ Broken):**
```
Payment completed → Redirects to localhost:3000/success
                  ↓
            ERROR: localhost not accessible
```

**After (✅ Fixed):**
```
Payment completed → Redirects to https://yourdomain.com/success
                  ↓
            SUCCESS: User sees confirmation page!
```

---

## Important Notes

### ⚠️ NO LOCALHOST in Production

- ❌ Do NOT set `NEXT_PUBLIC_APP_URL=http://localhost:3000` on deployed site
- ✅ Always use your actual domain: `https://yourdomain.com`
- ❌ Do NOT include `/success` in the variable
- ✅ Just the domain: `https://yourdomain.com`

### 🔐 HTTPS Required

Make sure your domain uses HTTPS:
- ✅ `https://yourdomain.com` - Correct
- ❌ `http://yourdomain.com` - Won't work with Razorpay
- ❌ `yourdomain.com` - Missing protocol

---

## Testing After Fix

1. **Wait 1-2 minutes** for deployment to complete
2. Go to your deployed website
3. Try checkout again
4. Complete payment with test card
5. ✅ Should redirect to `/success` on your domain (not localhost)

---

## Debugging

### Check if environment variable is set:

Visit your deployed API debug endpoint (if available):
```
https://yourdomain.com/api/debug/env
```

You should see:
```json
{
  "NEXT_PUBLIC_APP_URL": "SET",
  "NEXT_PUBLIC_APP_URL_value": "https://yourdomain.com"
}
```

### Check server logs:

The updated code now logs:
```
✅ Production mode - callback_url set to: https://yourdomain.com/success
```

If you see:
```
❌ ERROR: NEXT_PUBLIC_APP_URL environment variable is missing!
```

This means environment variable is not set on your deployment platform.

---

## Razorpay Settings (Production)

Make sure you've also updated Razorpay for production:

1. Go to https://dashboard.razorpay.com
2. Switch to **Live Mode** (toggle at top right)
3. Settings → API Keys
4. Get **Live Key ID** and **Key Secret**
5. Update your deployed environment:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxx (not rzp_test_)
   RAZORPAY_KEY_SECRET=xxxxx
   ```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Set `NEXT_PUBLIC_APP_URL` to your domain | ← **DO THIS NOW** |
| 2 | Redeploy your website | ← **DO THIS AFTER** |
| 3 | Test payment again | Check if fixed |

---

**Questions?**
- Check which deployment platform you're using
- Make sure you set the env variable BEFORE redeploying
- Verify the domain is correct (no localhost)
