-- UPDATED_SUPABASE_SETUP.sql (Consolidated)
-- Complete setup for Himalayan Runners HR webapp: profiles, treks, itinerary, registrations, bookings with safe RLS policies
-- Run this entire script in your Supabase SQL editor as the project owner.
-- This script enables client-side profile registration with role constraints and admin management capabilities.

-- ============================================================================
-- 1) EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2) PROFILES TABLE (linked to auth.users, stores role and approval status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','guide','admin')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3) PROFILES RLS POLICIES
-- ============================================================================

-- Insert: authenticated users can only create their own profile with forced role='user' and approved=false
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
    AND role = 'user'
    AND approved = false
  );

-- Select: users see only their own profile; admins see all profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Update: users can update own profile fields except role/approved; admins can update any field
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  )
  WITH CHECK (
    (
      id = auth.uid()
      AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      AND approved = (SELECT approved FROM public.profiles WHERE id = auth.uid())
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 4) TREKS TABLE (stores trek information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.treks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text,
  description text,
  price numeric,
  category text,
  guide_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treks_guide_id ON public.treks(guide_id);

ALTER TABLE public.treks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5) TREKS RLS POLICIES
-- ============================================================================

-- Select: public can view all treks
DROP POLICY IF EXISTS treks_select ON public.treks;
CREATE POLICY treks_select ON public.treks FOR SELECT USING (true);

-- Insert: guides and admins can insert treks
DROP POLICY IF EXISTS treks_insert ON public.treks;
CREATE POLICY treks_insert ON public.treks
  FOR INSERT
  WITH CHECK (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update: guide owner or admin can update trek
DROP POLICY IF EXISTS treks_update ON public.treks;
CREATE POLICY treks_update ON public.treks
  FOR UPDATE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Delete: guide owner or admin can delete trek
DROP POLICY IF EXISTS treks_delete ON public.treks;
CREATE POLICY treks_delete ON public.treks
  FOR DELETE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 6) TREK ITINERARY TABLE (stores daily itinerary details for each trek)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trek_itinerary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  day integer NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trek_itinerary_trek_id ON public.trek_itinerary(trek_id);
CREATE INDEX IF NOT EXISTS idx_trek_itinerary_day ON public.trek_itinerary(trek_id, day);

ALTER TABLE public.trek_itinerary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7) TREK ITINERARY RLS POLICIES
-- ============================================================================

-- Select: public can view all itinerary items
DROP POLICY IF EXISTS trek_itinerary_select ON public.trek_itinerary;
CREATE POLICY trek_itinerary_select ON public.trek_itinerary FOR SELECT USING (true);

-- Insert: trek guide owner or admin can insert itinerary
DROP POLICY IF EXISTS itinerary_insert ON public.trek_itinerary;
CREATE POLICY itinerary_insert ON public.trek_itinerary
  FOR INSERT
  WITH CHECK (
    ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Update: trek guide owner or admin can update itinerary
DROP POLICY IF EXISTS itinerary_update ON public.trek_itinerary;
CREATE POLICY itinerary_update ON public.trek_itinerary
  FOR UPDATE
  USING (
    ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Delete: trek guide owner or admin can delete itinerary
DROP POLICY IF EXISTS itinerary_delete ON public.trek_itinerary;
CREATE POLICY itinerary_delete ON public.trek_itinerary
  FOR DELETE
  USING (
    ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 8) REGISTRATIONS TABLE (user registrations for treks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  seats integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_trek_id ON public.registrations(trek_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9) REGISTRATIONS RLS POLICIES
-- ============================================================================

-- Insert: authenticated users can register themselves for a trek
DROP POLICY IF EXISTS registrations_insert ON public.registrations;
CREATE POLICY registrations_insert ON public.registrations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Select: user sees own registrations; trek guide or admin see all registrations for their/all treks
DROP POLICY IF EXISTS registrations_select ON public.registrations;
CREATE POLICY registrations_select ON public.registrations
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR ((SELECT guide_id FROM public.treks WHERE id = registrations.trek_id) = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 10) BOOKINGS TABLE (payment records for trek registrations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  amount numeric(10, 2),
  currency text DEFAULT 'INR',
  seats integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON public.bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_trek_id ON public.bookings(trek_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id ON public.bookings(razorpay_payment_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11) BOOKINGS RLS POLICIES
-- ============================================================================

-- Select: users see their own bookings; admins see all
DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Insert: authenticated users and payment system can insert bookings
DROP POLICY IF EXISTS bookings_insert ON public.bookings;
CREATE POLICY bookings_insert ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update: users can update their own bookings; admins can update any
DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- ============================================================================
-- ADMIN SETUP INSTRUCTIONS
-- ============================================================================

-- Step 1: Create your first user account by registering on the website
-- Step 2: Get the Auth User ID from Supabase → Authentication → Users (copy the 'user_id' UUID)
-- Step 3: Run this SQL statement in the SQL editor to promote the user to admin:
--
-- INSERT INTO public.profiles (id, email, full_name, role, approved, created_at)
-- VALUES ('<PASTE_AUTH_USER_ID_HERE>', 'your-email@example.com', 'Your Name', 'admin', true, now())
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', approved = true;
--
-- Step 4: Sign out and sign back in. You will now have admin access.
-- Step 5: Use the admin dashboard to:
--   - Manage treks (create, edit, delete)
--   - Add itineraries for treks
--   - View all registrations and bookings
--   - (Optional) Promote other users to guides or admins via Table Editor

-- IMPORTANT NOTES:
-- - RLS policies prevent users from self-elevating their role on the client side.
-- - Admins must be created manually via this SQL script or the Supabase Table Editor.
-- - Once admin is created, they can manage all data via the admin UI or direct DB access.

-- End of script
