# Quick Test Checklist for Admin Access

## Pre-Test Verification

### 1. Check Your Role in Supabase ✅
Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor and run:
```sql
SELECT id, email, role, approved FROM profiles WHERE email = 'sharshith241@gmail.com';
```
**Expected Output:**
- `role` column should show: `admin`
- `approved` column should show: `TRUE` or `t`

---

## Test 1: Login Flow ✅

**Steps:**
1. Go to `/auth/login` on your deployed site
2. Dropdown should show:
   - [ ] "User" option
   - [ ] "Admin" option
3. Select "Admin"
4. Enter credentials
5. Click "Sign In"

**Expected Result:**
- [ ] Green success message "Login successful! Redirecting..."
- [ ] Redirected to `/admin/dashboard`
- [ ] Browser URL changes to your domain + `/admin/dashboard`

**If it fails:**
- [ ] Check browser console (F12) for errors
- [ ] Look for log: `"User role from database: admin"`

---

## Test 2: Admin Dashboard Access ✅

**What you should see at `/admin/dashboard`:**
- [ ] Hero section with "📊 Admin Dashboard" title
- [ ] 4 stat cards showing:
  - [ ] Total Treks
  - [ ] Total Bookings
  - [ ] Total Guides
  - [ ] Total Users
- [ ] 3 quick action cards:
  - [ ] "🏔️ Manage Treks"
  - [ ] "📅 View Bookings"
  - [ ] "👨‍🏫 Manage Guides"

**If you see empty/loading state:**
- [ ] Wait 2-3 seconds for stats to load
- [ ] Check browser console for Supabase query errors

---

## Test 3: Trek Management ✅

**Steps:**
1. From admin dashboard, click **"Manage Treks"** card
2. OR go directly to `/admin/treks`

**Expected to see:**
- [ ] Page header: "🏔️ Trek Management"
- [ ] Green button "➕ Add New Trek" in top right
- [ ] List of all treks with:
  - [ ] Trek image
  - [ ] Trek title
  - [ ] Location
  - [ ] Duration
  - [ ] Difficulty
  - [ ] Price
  - [ ] Action buttons (Edit, Delete)

**If trek list is empty:**
- [ ] This is OK - you might not have treks in the database yet
- [ ] Click "Add New Trek" to create one

---

## Test 4: Debug Page ✅

**Go to:** `/admin/dashboard/debug`

**You should see:**
- [ ] Session Info showing your user ID and email
- [ ] Profile Data showing all your profile fields
- [ ] Your role should display: `admin` (in green)
- [ ] Message: "✅ Profile shows you ARE an admin!"

---

## Common Issues & Solutions

### Issue: "This account is not an admin"
**Cause:** Your role in the database is not set to "admin"
**Solution:** 
1. Go to Supabase dashboard
2. Table Editor → profiles table
3. Find your row (by email)
4. Change `role` column from "user" to "admin"
5. Log out and log back in

### Issue: Redirected to home page after login
**Cause:** Admin layout RLS check failing
**Solution:**
1. Open browser F12 → Console
2. Look for error messages
3. Check `/admin/dashboard/debug` page
4. If debug page also redirects, role is definitely not "admin"

### Issue: Admin dashboard shows but buttons don't work
**Cause:** RLS policies preventing data fetch
**Solution:**
1. Check browser console for fetch errors
2. Verify RLS policies in Supabase
3. Run SQL check:
   ```sql
   SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
   ```

### Issue: "Can't find page" at /admin/dashboard
**Cause:** Page file not created or syntax error
**Solution:**
- File should be at: `app/admin/dashboard/page.tsx`
- Check for typos or missing files

---

## Success Indicators

You'll know admin access is WORKING when:

✅ You can login with "Admin" role selected  
✅ You see the admin dashboard with stats  
✅ Trek management page loads with list of treks  
✅ Debug page shows role="admin"  
✅ You can add/edit/delete treks (if UI is implemented)  

---

## Need Help?

If any test fails:

1. **Take a screenshot** of the error
2. **Check browser console** (F12 → Console tab)
3. **Visit debug page**: `/admin/dashboard/debug`
4. **Share:**
   - The error message
   - Your role from debug page
   - Browser console errors

---

**Ready to test? Go to your site and follow the tests above!**
