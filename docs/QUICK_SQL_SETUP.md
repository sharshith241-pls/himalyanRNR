# Quick SQL Setup - Copy and Paste in Supabase SQL Editor

## Step 1: Create User Profiles Table
Run this in Supabase SQL Editor:

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Step 2: Update Treks Table to Add Guide Email
```sql
ALTER TABLE public.treks
ADD COLUMN guide_email TEXT;

CREATE INDEX idx_treks_guide_email ON public.treks(guide_email);
```

## Step 3: Create Guides Table
```sql
CREATE TABLE public.guides (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_guides_email ON public.guides(email);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view own profile" ON public.guides
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Guides can update own profile" ON public.guides
  FOR UPDATE USING (auth.uid() = id);
```

## Step 4: Create Trek Itinerary Table
```sql
CREATE TABLE public.trek_itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id UUID NOT NULL REFERENCES public.treks(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trek_itinerary_trek_id ON public.trek_itinerary(trek_id);
CREATE INDEX idx_trek_itinerary_day ON public.trek_itinerary(trek_id, day);

ALTER TABLE public.trek_itinerary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view itinerary" ON public.trek_itinerary
  FOR SELECT USING (true);

CREATE POLICY "Guides can modify trek itinerary" ON public.trek_itinerary
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Guides can update trek itinerary" ON public.trek_itinerary
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Guides can delete trek itinerary" ON public.trek_itinerary
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.treks
      WHERE treks.id = trek_itinerary.trek_id
      AND treks.guide_email = auth.jwt() ->> 'email'
    )
  );
```

## Step 5: Create Storage Bucket (via Dashboard)
1. Go to Supabase Dashboard > Storage
2. Click "Create new bucket"
3. Name: `trek-images`
4. Uncheck "Private bucket" to make it public
5. Click Create

## Step 6: Update Policy for Trek Image Upload
After creating bucket, go to Policies tab and create public read/write policy.

## Step 7: Create Guide Users in Supabase Auth (Manual)
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Create new user"
3. Enter guide email and password
4. Click "Create user"
5. Repeat for each guide

## Step 8: Assign Guides to Treks
Replace with your actual data:
```sql
UPDATE public.treks
SET guide_email = 'guide-email@example.com'
WHERE id = 'trek-id-here';

-- For multiple treks:
UPDATE public.treks
SET guide_email = 'guide1@example.com'
WHERE title = 'Kaiwara Betta Trek';

UPDATE public.treks
SET guide_email = 'guide2@example.com'
WHERE title = 'Kids Endurance Camp – Level 2';
```

## Step 9: Add Guide Profile Info (Optional)
```sql
INSERT INTO public.guides (id, email, full_name, phone, bio, experience_years)
SELECT id, email, email, '+91-0000000000', 'Experienced guide', 5
FROM auth.users
WHERE email = 'guide-email@example.com';
```

## Verification Queries

Check if setup is complete:

```sql
-- Check user_profiles table
SELECT COUNT(*) as "Registered Users" FROM public.user_profiles;

-- Check guides table
SELECT COUNT(*) as "Guides" FROM public.guides;

-- Check trek_itinerary table
SELECT COUNT(*) as "Itinerary Items" FROM public.trek_itinerary;

-- Check treks with guide assignments
SELECT title, guide_email FROM public.treks WHERE guide_email IS NOT NULL;

-- Check all guide assignments
SELECT 
  t.title, 
  t.guide_email,
  COALESCE(COUNT(b.id), 0) as registrations
FROM public.treks t
LEFT JOIN public.bookings b ON t.id = b.trek_id
WHERE t.guide_email IS NOT NULL
GROUP BY t.id, t.title, t.guide_email;
```

## Troubleshooting

### User registration not saving to user_profiles?
- Check that `utils/auth/actions.ts` has the latest code
- Verify user_profiles table exists and RLS policies are correct
- Check browser console for errors during signup

### Guide login not working?
- Verify guide email exists in Supabase Auth
- Check guide_email spelling in treks table
- Ensure guide has access to at least one trek

### Image upload failing?
- Check trek-images bucket exists and is public
- Verify storage policy allows authenticated users to upload
- Check image file size (max 50MB recommended)

### Itinerary not showing?
- Verify trek_itinerary table exists
- Check RLS policies are set correctly
- Verify trek_id in itinerary matches trek in treks table
