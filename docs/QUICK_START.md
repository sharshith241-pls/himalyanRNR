# 🚀 Quick Start Guide - Trek Management

## What Changed

| Issue | Before ❌ | After ✅ |
|-------|----------|---------|
| Admin Pages | 404 errors | ✅ All created |
| Trek Creation | Not possible | ✅ Full form |
| Dummy Treks | Always showing | ✅ Removed |
| Database Treks | Empty | ✅ Can add |
| Bookings View | Missing | ✅ Admin dashboard |
| Guide Approval | No way to approve | ✅ Approve button |

---

## Admin URLs

| Page | URL | What It Does |
|------|-----|--------------|
| Dashboard | `/admin/dashboard` | Stats & overview |
| Trek List | `/admin/treks` | View/edit/delete treks |
| Add Trek | `/admin/treks/new` | Create new trek |
| Edit Trek | `/admin/treks/{id}` | Edit trek details |
| Bookings | `/admin/bookings` | View all bookings |
| Guides | `/admin/guides` | Approve guides |

---

## First Steps

### Step 1: Add Your First Trek
```
1. Go to /admin/dashboard
2. Click "Manage Treks" card
3. Click "➕ Add New Trek" button
4. Fill in form:
   - Title
   - Location
   - Price (₹)
   - Duration (e.g., "2 days")
   - Difficulty (Easy/Moderate/Difficult)
   - Category
   - Description
5. Click "Create Trek"
```

### Step 2: View Trek as User
```
1. Logout or open incognito
2. Go to /treks
3. Your trek should appear
4. Click "View Details"
5. Should show full trek info
```

### Step 3: Edit Trek
```
1. Go to /admin/treks
2. Find your trek
3. Click "✏️ Edit" button
4. Update any field
5. Click "Save Changes"
```

### Step 4: Delete Trek
```
1. Go to /admin/treks
2. Find your trek
3. Click "🗑️ Delete" button
4. Click "OK" to confirm
5. Trek is removed
```

---

## Key Buttons & Actions

| Action | Location | Result |
|--------|----------|--------|
| Add Trek | `/admin/treks` - Top right | Opens form |
| Edit Trek | `/admin/treks` - Trek card | Opens edit form |
| Delete Trek | `/admin/treks` - Trek card | Removes trek |
| Approve Guide | `/admin/guides` - Guide row | Sets approved=true |
| Back | Any admin page - Top link | Goes back |

---

## Form Fields

### New/Edit Trek Form

**Required:**
- ⭐ Title
- ⭐ Location
- ⭐ Price

**Optional but recommended:**
- Duration (e.g., "2 days", "1 day")
- Difficulty (Easy/Moderate/Difficult)
- Category (Himalayan/Sunrise/Backpacking/etc)
- Description (What's special about this trek?)
- Image URL (URL to trek image)

---

## Admin Dashboard Stats

### Shows
- 🏔️ Total Treks (count from database)
- 📅 Total Bookings (count from database)
- 👨‍🏫 Total Guides (count of role='guide')
- 👥 Total Users (count of role='user')

### Quick Links
- Manage Treks
- View Bookings
- Manage Guides

---

## Security

### Who Can Do What?

**ADMIN** (`role='admin'`)
- ✅ Create treks
- ✅ Edit treks
- ✅ Delete treks
- ✅ Approve guides
- ✅ View all bookings

**GUIDE** (`role='guide'` + `approved=true`)
- ✅ Manage own treks
- ✅ View own bookings

**USER** (`role='user'`)
- ✅ View treks
- ✅ Book treks
- ✅ View own bookings

---

## Common Issues & Solutions

### Issue: Can't see "Add Trek" button
**Solution:** Make sure you're logged in as admin
- Go to `/admin/dashboard`
- If redirected to home, you're not admin
- Check Supabase: profiles table → your role should be 'admin'

### Issue: Trek doesn't appear after creating
**Solution:** 
- Refresh page (Ctrl+F5)
- Check form validation - all required fields filled?
- Check browser console (F12) for errors

### Issue: Can't delete trek
**Solution:**
- Only admins can delete
- Make sure logged in as admin
- Click "Delete" button and confirm

### Issue: Bookings page is empty
**Solution:** This is normal if no one has booked yet
- Bookings appear as users make payments
- Test by creating a booking yourself

---

## Database Tables

### Treks Table (Your Treks)
```
id | title | location | price | duration | difficulty | category
```

### Bookings Table (User Bookings)
```
id | trek_id | user_name | user_email | payment_status | created_at
```

### Profiles Table (Users/Admins/Guides)
```
id | email | full_name | role | approved
```

---

## Useful URLs

| For Admin | URL |
|-----------|-----|
| Dashboard | `/admin/dashboard` |
| Treks | `/admin/treks` |
| Add Trek | `/admin/treks/new` |
| Bookings | `/admin/bookings` |
| Guides | `/admin/guides` |
| Debug Info | `/admin/dashboard/debug` |

| For Users | URL |
|-----------|-----|
| All Treks | `/treks` |
| Trek Details | `/treks/{trek-id}` |
| Explore | `/` |

---

## Deployment Checklist

- [ ] Create bookings table (if not exists)
- [ ] Test adding a trek
- [ ] Test viewing trek as user
- [ ] Test editing trek
- [ ] Test deleting trek
- [ ] Test approving guide
- [ ] Commit changes: `git add -A && git commit -m "feat: complete trek management system"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Deploy to Vercel/hosting

---

## Need Help?

Check these documents:
1. `COMPLETE_FIX_SUMMARY.md` - Full overview
2. `TREK_MANAGEMENT_FIX.md` - Detailed features
3. `DATABASE_SETUP_TREK_MANAGEMENT.md` - SQL setup
4. `ADMIN_TEST_CHECKLIST.md` - Testing guide

---

**You're all set! Start adding treks now! 🎉**
