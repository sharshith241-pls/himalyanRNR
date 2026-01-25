# 📋 Quick Reference Card

## Startup Command
```bash
npm run dev
```

## Important URLs

### User Pages
- Homepage: `http://localhost:3000`
- Register: `http://localhost:3000/auth/register`
- Login: `http://localhost:3000/auth/login`
- Treks: `http://localhost:3000/treks`

### Guide Pages
- Guide Login: `http://localhost:3000/guide/login`
- Guide Dashboard: `http://localhost:3000/guide/dashboard`
- Manage Trek: `http://localhost:3000/guide/trek/[trek-id]/manage`

### Admin Pages
- Admin Dashboard: `http://localhost:3000/admin/treks`

## Quick SQL Commands

### Check User Registrations
```sql
SELECT email, full_name FROM user_profiles ORDER BY created_at DESC;
```

### Check Guides
```sql
SELECT email FROM guides;
```

### Assign Guide to Trek
```sql
UPDATE public.treks 
SET guide_email = 'guide@example.com' 
WHERE title = 'Trek Name';
```

### Check Itinerary
```sql
SELECT day, title FROM trek_itinerary 
WHERE trek_id = 'trek-id' 
ORDER BY day;
```

## Key Features Checklist

### User Features
- ✅ Register with email/password
- ✅ Data saved to database
- ✅ Login/logout
- ✅ Browse treks
- ✅ See guide info

### Guide Features
- ✅ Login with credentials
- ✅ View assigned treks
- ✅ See all participants
- ✅ Upload images
- ✅ Manage itinerary
- ✅ Delete itinerary items

### Admin Features
- ✅ Create guides in Auth
- ✅ Assign guides to treks
- ✅ Monitor system

## File Locations

| Feature | File |
|---------|------|
| User Signup | `app/auth/register/page.tsx` |
| User Login | `app/auth/login/page.tsx` |
| Guide Login | `app/guide/login/page.tsx` |
| Guide Dashboard | `app/guide/dashboard/page.tsx` |
| Trek Management | `app/guide/trek/[trekId]/manage/page.tsx` |
| Auth Logic | `utils/auth/actions.ts` |
| Logo | `public/logo.svg` |

## Database Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| user_profiles | id, email, full_name | User data |
| guides | id, email, full_name | Guide info |
| trek_itinerary | id, trek_id, day, title | Trek details |
| treks | ... guide_email | Added column |

## Documentation Map

Start here → `FINAL_SUMMARY.md` (overview)
↓
Then → `UPDATES_README.md` (features)
↓
Then → `IMPLEMENTATION_CHECKLIST.md` (setup)
↓
SQL → `QUICK_SQL_SETUP.md` (copy-paste)

## Setup in 4 Steps

1. **SQL**: Run files from `docs/` folder in Supabase
2. **Storage**: Create `trek-images` bucket
3. **Auth**: Create guide users
4. **Assign**: Update guide_email in treks table

## Testing Essential Flows

### User Registration
1. Go to `/auth/register`
2. Fill form
3. Submit
4. Check: `SELECT * FROM user_profiles`

### Guide Login
1. Go to `/guide/login`
2. Enter guide credentials
3. Should redirect to `/guide/dashboard`
4. Should see assigned treks

### Add Itinerary
1. From dashboard, click "Manage Trek"
2. Click "+ Add Day"
3. Fill form, click "Add Itinerary"
4. Should appear in list

### Upload Image
1. From trek management
2. Click "📤 Upload Image"
3. Select image
4. Should display after upload

## Common Commands

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Run linter
npm run lint

# Check TypeScript
npx tsc --noEmit
```

## Environment Variables

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Supabase Links

- Dashboard: https://app.supabase.com
- SQL Editor: In Dashboard > SQL Editor
- Storage: In Dashboard > Storage
- Auth: In Dashboard > Authentication

## Troubleshooting Quick Links

| Problem | See |
|---------|-----|
| SQL errors | `QUICK_SQL_SETUP.md` |
| Guide login | `GUIDE_PORTAL_SETUP.md` |
| Image upload | `STORAGE_SETUP_GUIDE.md` |
| Database | `DATABASE_UPDATES.md` |
| Setup help | `IMPLEMENTATION_CHECKLIST.md` |

## Key Credentials

### Guide Test Account (Example)
- Email: `guide@example.com`
- Password: `[Your password]`
- Status: Needs to be created in Supabase Auth

### User Test Account (Example)
- Email: `user@example.com`
- Password: `[Any password 8+ chars]`
- Status: Can register via website

## Performance Indicators

Monitor these metrics:
- Registration time: < 2s
- Dashboard load: < 2s
- Image upload: < 5s
- Itinerary save: < 1s

## Security Checklist

- ✅ RLS policies enabled
- ✅ Guide access control
- ✅ User privacy
- ✅ Password hashing
- ✅ HTTPS enabled
- ✅ Secure storage

## Mobile Testing

Test these on mobile:
- [ ] Homepage loads
- [ ] Registration form works
- [ ] Login works
- [ ] Dashboard responsive
- [ ] Trek management works
- [ ] Images display

## Backup Commands (PostgreSQL)

```bash
# Backup database
pg_dump postgresql://user:pass@host/db > backup.sql

# Restore database
psql postgresql://user:pass@host/db < backup.sql
```

## Monitoring

Check these regularly:
- Error logs
- User registrations
- Guide logins
- Storage usage
- Database performance

## Emergency Contacts

- Supabase Support: https://supabase.com/support
- GitHub Issues: Create issue if bugs found
- Documentation: Check `docs/` folder

## Success Indicators

You're good to go when:
- ✅ All SQL migrations completed
- ✅ Storage bucket created
- ✅ Guide accounts working
- ✅ User registration saves to DB
- ✅ Guide dashboard shows participants
- ✅ Itinerary management works
- ✅ Image upload working
- ✅ Mobile responsive
- ✅ Social links working
- ✅ Team trained

## Final Tips

1. **Test thoroughly** before production
2. **Read documentation** if stuck
3. **Follow checklist** step by step
4. **Backup early** and often
5. **Monitor after** going live
6. **Gather feedback** from guides
7. **Plan improvements** based on usage

---

**You've got this! 🚀**

All features are ready to use. Follow the checklist and you'll be live!

For detailed help, see the documentation files in the `/docs` folder.
