# 🚀 Quick Setup Guide - Enable Admin Access

## Step 1: Add `is_admin` Column to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `himalayan-runners` or `zqttwjxetmdppzdrnnpp`
3. Click **Table Editor** in the left sidebar
4. Select the **`user_profiles`** table
5. Click the **"+"** button to add a new column
6. Fill in:
   - **Name**: `is_admin`
   - **Type**: `boolean`
   - **Default value**: `false`
7. Click **Save**

## Step 2: Make Your Account Admin

1. In the **`user_profiles`** table, find your user row (search by email)
2. Click on the row to open details
3. Change the `is_admin` column value from `false` to `true`
4. Click **Save**

## Step 3: Test Admin Access

1. Go to your website: [localhost:3000](http://localhost:3000) (local) or [himalayangrunner.vercel.app](https://himalayangrunner.vercel.app) (production)
2. **Log out** if currently logged in
3. **Log in** with your admin email
4. Check the navigation bar - you should now see **🔧 Admin** link
5. Click it to access the admin dashboard

## Step 4: Setup Razorpay (For Payments)

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings → API Keys**
3. Copy your **Key ID** and **Key Secret**
4. Add to Vercel environment variables:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = Your Key ID
   - `RAZORPAY_KEY_SECRET` = Your Key Secret
5. Redeploy the application

---

## 🎯 What Admin Users Can Do

✅ View all treks  
✅ Add new treks to the database  
✅ Edit trek details  
✅ Delete treks  
✅ See all bookings (when payment integration is live)  

---

## 🔍 Troubleshooting

### Admin link not showing?
- ✓ Verify you set `is_admin = true` in Supabase for your user
- ✓ Log out and log back in
- ✓ Check browser console for errors (F12)
- ✓ Clear browser cache (Ctrl+Shift+Delete)

### Payments not working?
- ✓ Verify Razorpay keys are set in environment variables
- ✓ Check that keys are for test mode (not live)
- ✓ Restart the application after adding env variables

### User not found in user_profiles?
- ✓ Make sure the user logs in at least once
- ✓ Check that Supabase Auth is configured correctly
- ✓ Verify the user email matches in both tables

---

## 📞 Database Schema Reference

### `user_profiles` table
```sql
- id (uuid, primary key)
- email (text)
- name (text)
- is_admin (boolean, default: false)  -- NEW COLUMN
- created_at (timestamp)
```

### `treks` table
```sql
- id (uuid, primary key)
- title (text)
- location (text)
- duration (text)
- difficulty (text)
- price (number)
- category (text)
- description (text)
- created_at (timestamp)
```

### `bookings` table
```sql
- id (uuid, primary key)
- trek_id (uuid, foreign key)
- user_email (text)
- user_name (text)
- razorpay_order_id (text)
- razorpay_payment_id (text)
- razorpay_signature (text)
- status (text)
- amount (number)
- currency (text)
- created_at (timestamp)
```

---

## 💡 Tips

- Test as regular user first (without is_admin)
- Then set is_admin = true and refresh browser
- Admin dashboard at `/admin/treks`
- Regular users see home → treks listing → booking flow
- Admin users see additional 🔧 Admin link in navigation

---

**Deployment URL**: https://himalayangrunner.vercel.app  
**Local Dev**: `npm run dev` → http://localhost:3000

Last updated: 2024
