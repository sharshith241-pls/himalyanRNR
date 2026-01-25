# Database Schema Updates Required

## 1. Update treks Table

Add the `guide_email` column to track which guide manages each trek:

```sql
ALTER TABLE public.treks
ADD COLUMN guide_email TEXT;

-- Create index for faster lookups
CREATE INDEX idx_treks_guide_email ON public.treks(guide_email);

-- Update existing treks with guide emails as needed
UPDATE public.treks
SET guide_email = 'your-guide-email@example.com'
WHERE id = 'trek-id';
```

## 2. Create user_profiles Table

Store user information when they sign up:

```sql
-- Copy the contents from USER_PROFILES_TABLE.sql
```

## 3. Create guides Table

Store guide information:

```sql
-- Copy the contents from GUIDES_AND_ITINERARY_TABLES.sql (first part)
```

## 4. Create trek_itinerary Table

Store day-by-day itinerary details:

```sql
-- Copy the contents from GUIDES_AND_ITINERARY_TABLES.sql (second part)
```

## 5. Storage Bucket for Trek Images

Create a public bucket for trek images:

1. Go to Supabase Dashboard
2. Click Storage in the sidebar
3. Create new bucket with name: `trek-images`
4. Make it public
5. Set access policies

## Complete Implementation Checklist

- [ ] Run USER_PROFILES_TABLE.sql to create user_profiles table
- [ ] Run GUIDES_AND_ITINERARY_TABLES.sql to create guides and trek_itinerary tables
- [ ] Add `guide_email` column to existing treks table
- [ ] Create `trek-images` storage bucket
- [ ] Create guide users in Supabase Auth
- [ ] Assign guides to treks by updating guide_email
- [ ] Test guide login at `/guide/login`
- [ ] Test guide dashboard at `/guide/dashboard`
- [ ] Verify user registration now saves to user_profiles table
- [ ] Test image upload functionality
- [ ] Test itinerary creation/deletion
