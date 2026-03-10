-- ============================================================================
-- COMPLETE_SUPABASE_SETUP.sql
-- Unified Supabase setup for Himalayan Runners HR webapp
-- 
-- This is the SINGLE source of truth for the entire database schema.
-- Run this ENTIRE script in a fresh Supabase project's SQL Editor.
--
-- Includes: extensions, tables, indexes, RLS policies, storage policies
-- Tables:  profiles, treks, trek_itinerary, bookings, coupon_codes,
--          coupon_usage_logs
-- ============================================================================


-- ============================================================================
-- 1) EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2) PROFILES TABLE
--    Linked to auth.users. Stores role (user/guide/admin) and approval status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3) TREKS TABLE
--    Trek listings with all detail columns used by the admin UI.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.treks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location text,
  description text,
  price numeric,
  duration text,
  difficulty text DEFAULT 'Easy',
  category text DEFAULT 'himalayan-treks',
  image_url text,
  itinerary text,
  included text,
  not_included text,
  important_info text,
  guide_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treks_guide_id ON public.treks(guide_id);
ALTER TABLE public.treks ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4) TREK ITINERARY TABLE
--    Day-by-day trek details with optional images.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trek_itinerary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid NOT NULL REFERENCES public.treks(id) ON DELETE CASCADE,
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
-- 5) BOOKINGS TABLE
--    Payment records with Razorpay integration.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid NOT NULL REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON public.bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_trek_id ON public.bookings(trek_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id ON public.bookings(razorpay_payment_id);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 6) COUPON CODES TABLE
--    Discount coupon system with usage limits and expiry.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  discount_percentage decimal(5, 2) NOT NULL DEFAULT 10.00,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  estimated_expiry timestamptz DEFAULT (now() + INTERVAL '1 year'),
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  trek_ids text[] DEFAULT ARRAY[]::text[],
  notes text,
  CONSTRAINT check_discount CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  CONSTRAINT check_uses CHECK (current_uses <= max_uses OR max_uses IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON public.coupon_codes(is_active);
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 7) COUPON USAGE LOGS TABLE
--    Tracks every coupon redemption with payment details.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id varchar(100),
  trek_id varchar(100) NOT NULL,
  discount_amount decimal(10, 2) NOT NULL,
  original_amount decimal(10, 2) NOT NULL,
  final_amount decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage_logs(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_payment_id ON public.coupon_usage_logs(payment_id);
ALTER TABLE public.coupon_usage_logs ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 8) RLS POLICIES — PROFILES
--    - Public SELECT (avoids infinite recursion when other policies check role)
--    - Users INSERT their own profile row
--    - Users UPDATE own profile; admins can update any
-- ============================================================================

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
  );

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- 9) RLS POLICIES — TREKS
--    - Public SELECT
--    - Guides (guide_id) and admins can INSERT
--    - Trek owner or admin can UPDATE / DELETE
-- ============================================================================

DROP POLICY IF EXISTS treks_select ON public.treks;
CREATE POLICY treks_select ON public.treks
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS treks_insert ON public.treks;
CREATE POLICY treks_insert ON public.treks
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (guide_id IS NOT NULL AND guide_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS treks_update ON public.treks;
CREATE POLICY treks_update ON public.treks
  FOR UPDATE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS treks_delete ON public.treks;
CREATE POLICY treks_delete ON public.treks
  FOR DELETE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- 10) RLS POLICIES — TREK ITINERARY
--     - Public SELECT
--     - Trek owner (guide) or admin can INSERT / UPDATE / DELETE
-- ============================================================================

DROP POLICY IF EXISTS trek_itinerary_select ON public.trek_itinerary;
CREATE POLICY trek_itinerary_select ON public.trek_itinerary
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS itinerary_insert ON public.trek_itinerary;
CREATE POLICY itinerary_insert ON public.trek_itinerary
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS itinerary_update ON public.trek_itinerary;
CREATE POLICY itinerary_update ON public.trek_itinerary
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS itinerary_delete ON public.trek_itinerary;
CREATE POLICY itinerary_delete ON public.trek_itinerary
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- 11) RLS POLICIES — BOOKINGS
--     - Users see own bookings (by user_id or email); admins see all
--     - Open INSERT (payment system creates bookings)
--     - Users UPDATE own bookings; admins can update any
-- ============================================================================

DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_email = auth.jwt() ->> 'email'
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

DROP POLICY IF EXISTS bookings_insert ON public.bookings;
CREATE POLICY bookings_insert ON public.bookings
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR user_email = auth.jwt() ->> 'email'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- 12) RLS POLICIES — COUPON CODES
--     - Authenticated users can view active coupons; admins see all
--     - Only admins can INSERT coupons
--     - Creator or admin can UPDATE coupons
-- ============================================================================

DROP POLICY IF EXISTS coupon_codes_select ON public.coupon_codes;
CREATE POLICY coupon_codes_select ON public.coupon_codes
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS coupon_codes_insert ON public.coupon_codes;
CREATE POLICY coupon_codes_insert ON public.coupon_codes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS coupon_codes_update ON public.coupon_codes;
CREATE POLICY coupon_codes_update ON public.coupon_codes
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================================
-- 13) RLS POLICIES — COUPON USAGE LOGS
--     - Users see own usage; admins see all
--     - Open INSERT (backend/payment system creates logs)
-- ============================================================================

DROP POLICY IF EXISTS coupon_usage_logs_select ON public.coupon_usage_logs;
CREATE POLICY coupon_usage_logs_select ON public.coupon_usage_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS coupon_usage_logs_insert ON public.coupon_usage_logs;
CREATE POLICY coupon_usage_logs_insert ON public.coupon_usage_logs
  FOR INSERT
  WITH CHECK (true);


-- ============================================================================
-- 14) STORAGE POLICIES — trek-images bucket
--     NOTE: Create the 'trek-images' bucket in Supabase Dashboard → Storage
--           before running these policies.
-- ============================================================================

DROP POLICY IF EXISTS "Public read trek-images" ON storage.objects;
CREATE POLICY "Public read trek-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'trek-images');

DROP POLICY IF EXISTS "Authenticated upload trek-images" ON storage.objects;
CREATE POLICY "Authenticated upload trek-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trek-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated update trek-images" ON storage.objects;
CREATE POLICY "Authenticated update trek-images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'trek-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete trek-images" ON storage.objects;
CREATE POLICY "Authenticated delete trek-images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated');


-- ============================================================================
-- 15) ADMIN SETUP INSTRUCTIONS
-- ============================================================================
--
-- Step 1: Register a user account on the website (or create one in
--         Supabase Dashboard → Authentication → Users).
--
-- Step 2: Copy the Auth User ID (UUID) from Authentication → Users.
--
-- Step 3: Run this statement to promote that user to admin:
--
--   INSERT INTO public.profiles (id, email, full_name, role, approved)
--   VALUES ('<PASTE_AUTH_USER_ID>', 'your-email@example.com', 'Your Name', 'admin', true)
--   ON CONFLICT (id) DO UPDATE SET role = 'admin', approved = true;
--
-- Step 4: Create a 'trek-images' bucket in Supabase Dashboard → Storage
--         (set it to public if you want direct image URLs).
--
-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
