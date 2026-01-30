# 🗄️ Database Setup for Trek Management

## Create Bookings Table

If you don't have a bookings table, run this SQL in Supabase:

```sql
-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  payment_status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own bookings
CREATE POLICY bookings_select_own ON public.bookings
FOR SELECT
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow admins to view all bookings
CREATE POLICY bookings_select_admin ON public.bookings
FOR SELECT
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow admins to update bookings
CREATE POLICY bookings_update_admin ON public.bookings
FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow users to insert their own bookings
CREATE POLICY bookings_insert ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Verify Treks Table Structure

Make sure your `treks` table has all these columns:

```sql
-- Check table structure
\d public.treks;

-- Should output columns like:
-- id (uuid, Primary key)
-- title (text)
-- location (text)
-- description (text)
-- price (numeric)
-- duration (text)
-- difficulty (text)
-- category (text)
-- image_url (text)
-- guide_id (uuid, nullable - references profiles.id)
-- created_at (timestamptz)
```

If any columns are missing, add them:

```sql
-- Add missing columns if needed
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS image_url text;
```

---

## Insert Sample Trek (Optional)

If you want to test with a sample trek:

```sql
-- Insert a sample trek (replace guide_id if you have a guide)
INSERT INTO public.treks (title, location, description, price, duration, difficulty, category)
VALUES (
  'Sunrise Trek',
  'Himalayan Region',
  'Beautiful sunrise trek with scenic views',
  2499,
  '1 day',
  'Easy',
  'sunrise-treks'
);
```

---

## RLS Policies for Trek Management

Make sure these policies exist:

```sql
-- Allow anyone to view treks
CREATE POLICY treks_select ON public.treks
FOR SELECT
USING (true);

-- Allow admins to create treks
CREATE POLICY treks_insert_admin ON public.treks
FOR INSERT
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow admins and guides to update their treks
CREATE POLICY treks_update ON public.treks
FOR UPDATE
USING (
  guide_id = auth.uid() OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  guide_id = auth.uid() OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to delete treks
CREATE POLICY treks_delete_admin ON public.treks
FOR DELETE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

---

## Verify Setup

After setting up, run these queries to verify:

```sql
-- Check bookings table exists
SELECT * FROM information_schema.tables WHERE table_name = 'bookings';

-- Check treks table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'treks' ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('treks', 'bookings');

-- Count treks
SELECT COUNT(*) as trek_count FROM public.treks;

-- Count bookings
SELECT COUNT(*) as booking_count FROM public.bookings;
```

---

## If Queries Fail

If you get permission errors:

1. Go to Supabase Dashboard → SQL Editor
2. Make sure you're connected as the **project owner/superuser**
3. Switch to the **public** schema
4. Run the queries

---

**Setup complete! Now you can:**
✅ Create treks via admin panel  
✅ Edit treks via admin panel  
✅ Delete treks via admin panel  
✅ View bookings via admin panel  
✅ Manage guides via admin panel  
