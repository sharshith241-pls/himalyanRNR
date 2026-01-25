# Complete Implementation Checklist

## Pre-Implementation

- [ ] Backup current database
- [ ] Test on development environment first
- [ ] Have Supabase admin credentials ready
- [ ] Read all documentation files

## Database Setup (Run in order)

### Step 1: User Profiles Table
- [ ] Open `docs/USER_PROFILES_TABLE.sql`
- [ ] Copy entire SQL content
- [ ] Paste in Supabase SQL Editor
- [ ] Click "Run"
- [ ] Verify table created with: `SELECT * FROM user_profiles LIMIT 1;`

### Step 2: Update Treks Table
- [ ] Copy SQL from `docs/DATABASE_UPDATES.md` (Step 1)
- [ ] Run in Supabase SQL Editor
- [ ] Verify with: `SELECT * FROM treks LIMIT 1;` (should show guide_email column)

### Step 3: Guides Table
- [ ] Open `docs/GUIDES_AND_ITINERARY_TABLES.sql`
- [ ] Copy first part (guides table)
- [ ] Run in Supabase SQL Editor
- [ ] Verify with: `SELECT * FROM guides LIMIT 1;`

### Step 4: Trek Itinerary Table
- [ ] Copy second part (trek_itinerary table)
- [ ] Run in Supabase SQL Editor
- [ ] Verify with: `SELECT * FROM trek_itinerary LIMIT 1;`

## Storage Setup

- [ ] Go to Supabase Dashboard > Storage
- [ ] Click "Create new bucket"
- [ ] Name: `trek-images` (exactly)
- [ ] **Uncheck** "Private bucket"
- [ ] Click "Create bucket"
- [ ] Verify bucket is public (toggle should be ON)

## Authentication & Users Setup

### Create Guide Users
- [ ] Go to Supabase Auth > Users
- [ ] For each guide:
  - [ ] Click "Create new user"
  - [ ] Email: [guide email]
  - [ ] Password: [create strong password]
  - [ ] Click "Create user"
  - [ ] Note: Share credentials with guide securely

### Assign Guides to Treks
- [ ] For each trek, run SQL:
```sql
UPDATE public.treks
SET guide_email = 'guide@example.com'
WHERE title = 'Trek Title Here';
```
- [ ] Verify with: `SELECT title, guide_email FROM treks WHERE guide_email IS NOT NULL;`

### Create Guide Profiles (Optional but Recommended)
- [ ] For each guide, run:
```sql
INSERT INTO public.guides (id, email, full_name, phone, bio, experience_years)
SELECT id, email, 'Guide Full Name', '+91-XXXXXXXXXX', 'Professional bio', 5
FROM auth.users
WHERE email = 'guide@example.com';
```

## Code Deployment

### Frontend Changes
- [ ] Verify all TypeScript files compile without errors
- [ ] Test registration form (should save to user_profiles)
- [ ] Test login form (should be simplified UI)
- [ ] Test guide login page loads
- [ ] Verify logo displays on all pages

### Test User Registration Flow
- [ ] Go to `/auth/register`
- [ ] Fill form with test data
- [ ] Submit registration
- [ ] Check Supabase: `SELECT * FROM user_profiles;` (should show new user)
- [ ] Verify email and full_name are saved correctly

### Test Guide Portal
- [ ] Go to `/guide/login`
- [ ] Login with guide credentials
- [ ] Verify redirected to `/guide/dashboard`
- [ ] Verify assigned treks are displayed
- [ ] Click on a trek
- [ ] Verify registrations display if any

### Test Trek Management
- [ ] From guide dashboard, click "Manage Trek"
- [ ] Upload a test image
- [ ] Verify image appears after upload
- [ ] Add itinerary item:
  - [ ] Enter day number
  - [ ] Enter title
  - [ ] Enter description
  - [ ] Click "Add Itinerary"
- [ ] Verify item appears in list
- [ ] Test delete: click "🗑️ Delete" and confirm
- [ ] Verify item is removed

## Frontend Testing

### Homepage
- [ ] Logo displays correctly
- [ ] Navigation shows "Guide Portal" button
- [ ] Footer has Facebook icon with correct link
- [ ] Footer has Instagram icon with correct link
- [ ] Social icons are clickable and open new tabs

### Registration Page
- [ ] UI looks clean and simple (no gradients)
- [ ] Form fields are visible and accessible
- [ ] Error messages display properly
- [ ] Success message appears after signup
- [ ] Data saved to user_profiles table

### Login Page
- [ ] UI matches registration page styling
- [ ] Form works correctly
- [ ] Error/success messages work
- [ ] Forgot password link works

### Guide Login
- [ ] Page loads without errors
- [ ] Form validates input
- [ ] Correct credentials allow login
- [ ] Wrong credentials show error
- [ ] Redirects to dashboard after successful login

### Guide Dashboard
- [ ] Shows all assigned treks
- [ ] Displays participant count
- [ ] Trek selection works
- [ ] Participant list displays correctly
- [ ] Statistics cards show correct numbers
- [ ] "Manage Trek" button is clickable

### Trek Management
- [ ] Image upload field visible
- [ ] Image upload works
- [ ] Add itinerary form appears when clicked
- [ ] Itinerary items save and display
- [ ] Delete functionality works with confirmation
- [ ] Can add multiple itinerary items

## Security Testing

- [ ] Guide can't access other guide's treks
- [ ] Users can only see their own profiles
- [ ] No SQL injection vulnerabilities
- [ ] Passwords are not logged or exposed
- [ ] RLS policies are enforced
- [ ] File uploads are restricted to authenticated users

## Mobile Testing

- [ ] Check homepage on mobile
- [ ] Registration form works on mobile
- [ ] Guide dashboard responsive on mobile
- [ ] Trek management mobile-friendly
- [ ] Images display correctly on mobile
- [ ] Navigation easy on small screens

## Performance Testing

- [ ] Dashboard loads quickly (< 2s)
- [ ] Image upload completes smoothly
- [ ] No memory leaks or lag
- [ ] Database queries are efficient
- [ ] Page transitions are smooth

## Documentation

- [ ] `UPDATES_README.md` - Complete overview ✓
- [ ] `IMPLEMENTATION_SUMMARY.md` - Technical details ✓
- [ ] `GUIDE_PORTAL_SETUP.md` - Setup guide ✓
- [ ] `QUICK_SQL_SETUP.md` - SQL commands ✓
- [ ] `DATABASE_UPDATES.md` - DB checklist ✓
- [ ] `STORAGE_SETUP_GUIDE.md` - Storage setup ✓
- [ ] All docs in `/docs` folder ✓

## Production Deployment

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Code reviewed
- [ ] Database backups taken
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] CDN configured (if using)

### Deployment
- [ ] Build production version: `npm run build`
- [ ] Verify build succeeds without errors
- [ ] Deploy to production
- [ ] Run smoke tests in production
- [ ] Monitor error logs
- [ ] Test all critical paths

### Post-Deployment
- [ ] Verify homepage loads
- [ ] Test user registration
- [ ] Test guide login
- [ ] Verify database connectivity
- [ ] Check storage bucket access
- [ ] Monitor performance
- [ ] Get user feedback

## Rollback Plan

- [ ] Keep database backup ready
- [ ] Note current commit ID before deployment
- [ ] Have rollback script prepared
- [ ] Document rollback steps
- [ ] Test rollback in dev environment
- [ ] Keep previous version deployed if possible

## Monitoring & Maintenance

### Daily
- [ ] Check application error logs
- [ ] Monitor database performance
- [ ] Review new user registrations
- [ ] Check guide activity logs

### Weekly
- [ ] Review storage usage
- [ ] Check database backups completed
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly
- [ ] Analyze usage patterns
- [ ] Plan database optimization
- [ ] Update documentation
- [ ] Security audit
- [ ] Storage cleanup

## Troubleshooting Guide

If issues arise:

1. **User Registration Not Working**
   - [ ] Check `utils/auth/actions.ts` is updated
   - [ ] Verify user_profiles table exists
   - [ ] Check RLS policies on user_profiles
   - [ ] Review browser console errors

2. **Guide Login Failing**
   - [ ] Verify guide user exists in Auth
   - [ ] Check guide_email in treks table
   - [ ] Verify guide email spelling matches exactly
   - [ ] Check localStorage is not blocked

3. **Itinerary Not Saving**
   - [ ] Verify trek_itinerary table exists
   - [ ] Check guide has access to trek (guide_email matches)
   - [ ] Verify all form fields are filled
   - [ ] Check RLS policies

4. **Image Upload Failed**
   - [ ] Verify trek-images bucket exists
   - [ ] Check bucket is public
   - [ ] Verify file format (JPG, PNG, WebP)
   - [ ] Check file size < 50MB
   - [ ] Review browser console errors

5. **Slow Performance**
   - [ ] Check database query efficiency
   - [ ] Verify indexes are created
   - [ ] Monitor storage bandwidth
   - [ ] Clear browser cache
   - [ ] Check server resources

## Sign-Off

- [ ] All items completed
- [ ] Testing passed
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Launch approved

**Completed by**: _________________ **Date**: _________

**Tested by**: _________________ **Date**: _________

**Approved by**: _________________ **Date**: _________

---

**Total Checklist Items**: 150+
**Estimated Time**: 2-3 hours
**Difficulty Level**: Medium
