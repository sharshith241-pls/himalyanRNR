# How to Become an Admin

Your account is currently set as a regular `user`. To access the admin panel, you need to have your role set to `admin` in the database.

## Steps to Enable Admin Access:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL query:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'sharshith241@gmail.com';
```

> **Replace `sharshith241@gmail.com` with your actual email address**

6. Click **Run** button (or press Ctrl+Enter)
7. You should see "1 row(s) updated" message
8. Refresh your browser and try accessing `/admin` again

### Option 2: Check Your Current Role

To verify your current role, run this query:

```sql
SELECT id, email, role FROM profiles WHERE email = 'sharshith241@gmail.com';
```

Replace with your email address.

## What You'll Get Access To:

Once your role is set to `admin`, you'll be able to:
- ✅ Access `/admin` portal
- ✅ View the admin dashboard at `/admin/dashboard`
- ✅ Manage treks at `/admin/treks` (create, edit, delete)
- ✅ View bookings at `/admin/bookings`
- ✅ Manage guides at `/admin/guides`

## Next Steps:

1. Set your role to `admin` using one of the methods above
2. Log out and log back in
3. Navigate to `http://localhost:3000/admin` or `/admin` on your deployment
4. You should now see the admin dashboard
5. Click on **Manage Treks** to add/edit/delete treks

## Troubleshooting:

If you still can't access the admin panel after setting the role:
- Clear your browser cache (Ctrl+Shift+Delete)
- Log out completely
- Log back in
- Try accessing `/admin` again

If you see "Not authorized" error:
- Double-check that the email you used in the SQL query matches your login email exactly (case-sensitive)
- Make sure you ran the UPDATE query successfully
