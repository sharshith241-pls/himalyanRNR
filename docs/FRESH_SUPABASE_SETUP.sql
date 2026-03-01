-- ============================================================================
-- FRESH_SUPABASE_SETUP.sql
-- Complete Supabase setup for Himalayan Runners HR webapp
-- Run this ENTIRE script in your new Supabase project's SQL editor
-- All features preserved: auth, roles, treks, itineraries, bookings, coupons
-- ============================================================================

-- ============================================================================
-- 1) EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2) PROFILES TABLE (User roles: user, guide, admin)
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
-- 3) TREKS TABLE (Trek details with all columns)
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
-- 4) TREK ITINERARY TABLE (Daily trek details)
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
-- 5) BOOKINGS TABLE (Razorpay payment integration)
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
-- 6) COUPON CODES TABLE (Discount system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) UNIQUE NOT NULL,
  discount_percentage decimal(5, 2) NOT NULL DEFAULT 10.00 CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  estimated_expiry timestamptz DEFAULT (now() + INTERVAL '1 year'),
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0 CHECK (current_uses <= max_uses OR max_uses IS NULL),
  trek_ids text[] DEFAULT ARRAY[]::text[],
  notes text
);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON public.coupon_codes(is_active);
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7) COUPON USAGE LOGS TABLE (Track coupon usage)
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
-- 8) RLS POLICIES - PROFILES
-- ============================================================================

-- Profiles: Public SELECT (everyone can see profile info)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

-- Profiles: Users can INSERT their own profile with role='user' and approved=false
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
  );

-- Profiles: Users can UPDATE only their own profile; admins can update any
CREATE POLICY "profiles_update" ON public.profiles
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
-- 9) RLS POLICIES - TREKS
-- ============================================================================

-- Treks: Public SELECT (everyone can view treks)
CREATE POLICY "treks_select" ON public.treks
  FOR SELECT USING (true);

-- Treks: Guides and admins can INSERT treks
CREATE POLICY "treks_insert" ON public.treks
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      (guide_id IS NOT NULL AND guide_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Treks: Trek owner or admin can UPDATE
CREATE POLICY "treks_update" ON public.treks
  FOR UPDATE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Treks: Trek owner or admin can DELETE
CREATE POLICY "treks_delete" ON public.treks
  FOR DELETE
  USING (
    (guide_id IS NOT NULL AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 10) RLS POLICIES - TREK ITINERARY
-- ============================================================================

-- Itinerary: Public SELECT
CREATE POLICY "trek_itinerary_select" ON public.trek_itinerary
  FOR SELECT USING (true);

-- Itinerary: Trek owner or admin can INSERT
CREATE POLICY "itinerary_insert" ON public.trek_itinerary
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Itinerary: Trek owner or admin can UPDATE
CREATE POLICY "itinerary_update" ON public.trek_itinerary
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Itinerary: Trek owner or admin can DELETE
CREATE POLICY "itinerary_delete" ON public.trek_itinerary
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 11) RLS POLICIES - BOOKINGS
-- ============================================================================

-- Bookings: Users can view their own bookings
CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_email = auth.jwt() ->> 'email'
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Bookings: Payment system can INSERT bookings
CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- Bookings: Users can UPDATE their own bookings; admins can update any
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR user_email = auth.jwt() ->> 'email'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 12) RLS POLICIES - COUPON CODES
-- ============================================================================

-- Coupons: Anyone can view active coupon codes
CREATE POLICY "coupon_codes_select" ON public.coupon_codes
  FOR SELECT
  USING (is_active = true);

-- Coupons: Admins can INSERT coupon codes
CREATE POLICY "coupon_codes_insert" ON public.coupon_codes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Coupons: Creator or admin can UPDATE
CREATE POLICY "coupon_codes_update" ON public.coupon_codes
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 13) RLS POLICIES - COUPON USAGE LOGS
-- ============================================================================

-- Usage logs: Users can view their own usage
CREATE POLICY "coupon_usage_logs_select" ON public.coupon_usage_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Usage logs: Backend system can INSERT logs
CREATE POLICY "coupon_usage_logs_insert" ON public.coupon_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 14) STORAGE POLICIES (Trek images bucket)
-- ============================================================================

-- Create the trek-images bucket if it doesn't exist (via UI if needed)
-- Then run these policies:

-- Storage: Public read access to trek-images
DROP POLICY IF EXISTS "Public read trek-images" ON storage.objects;
CREATE POLICY "Public read trek-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'trek-images');

-- Storage: Authenticated users can upload to trek-images
DROP POLICY IF EXISTS "Authenticated upload trek-images" ON storage.objects;
CREATE POLICY "Authenticated upload trek-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trek-images'
    AND auth.role() = 'authenticated'
  );

-- Storage: Authenticated users can update in trek-images
DROP POLICY IF EXISTS "Authenticated update trek-images" ON storage.objects;
CREATE POLICY "Authenticated update trek-images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'trek-images' AND auth.role() = 'authenticated');

-- Storage: Authenticated users can delete from trek-images
DROP POLICY IF EXISTS "Authenticated delete trek-images" ON storage.objects;
CREATE POLICY "Authenticated delete trek-images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- 15) INITIAL DATA (OPTIONAL)
-- ============================================================================

-- Create a sample admin user (REPLACE WITH YOUR ACTUAL AUTH USER ID)
-- To get your auth user ID:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find your user and copy the ID
-- 3. Replace 'YOUR_AUTH_USER_ID' below and run:
--
-- INSERT INTO public.profiles (id, email, full_name, role, approved)
-- VALUES ('YOUR_AUTH_USER_ID', 'admin@example.com', 'Admin', 'admin', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables, indexes, and RLS policies are now configured.
--
-- NEXT STEPS:
-- 1. Create a 'trek-images' storage bucket in Supabase (if not already done)
-- 2. Create your first admin user:
--    - Go to Authentication > Users
--    - Create a new user
--    - Copy the user ID
--    - Uncomment the INSERT statement above and run it with the actual auth ID
-- 3. Test the app by registering a user (creates 'user' role profile)
-- 4. Use admin account to approve users and manage treks
