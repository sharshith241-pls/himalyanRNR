-- FIX_INFINITE_RECURSION.sql
-- This fixes the infinite recursion error in RLS policies

-- First, disable RLS temporarily to recreate policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.treks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trek_itinerary DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
DROP POLICY IF EXISTS treks_select ON public.treks;
DROP POLICY IF EXISTS treks_insert ON public.treks;
DROP POLICY IF EXISTS treks_update ON public.treks;
DROP POLICY IF EXISTS treks_delete ON public.treks;
DROP POLICY IF EXISTS trek_itinerary_select ON public.trek_itinerary;
DROP POLICY IF EXISTS itinerary_insert ON public.trek_itinerary;
DROP POLICY IF EXISTS itinerary_update ON public.trek_itinerary;
DROP POLICY IF EXISTS itinerary_delete ON public.trek_itinerary;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trek_itinerary ENABLE ROW LEVEL SECURITY;

-- Create NON-RECURSIVE policies

-- Profiles: Public SELECT (no recursion)
CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Treks: Public SELECT
CREATE POLICY treks_select ON public.treks
FOR SELECT
USING (true);

-- Treks: Authenticated users can INSERT treks with guide_id = current user
CREATE POLICY treks_insert ON public.treks
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' 
  AND guide_id = auth.uid()
);

-- Treks: Users can UPDATE their own treks (where guide_id = current user)
CREATE POLICY treks_update ON public.treks
FOR UPDATE
USING (guide_id = auth.uid())
WITH CHECK (guide_id = auth.uid());

-- Treks: Users can DELETE their own treks
CREATE POLICY treks_delete ON public.treks
FOR DELETE
USING (guide_id = auth.uid());

-- Trek Itinerary: Public SELECT
CREATE POLICY trek_itinerary_select ON public.trek_itinerary
FOR SELECT
USING (true);

-- Trek Itinerary: Authenticated users can INSERT if they own the trek
CREATE POLICY itinerary_insert ON public.trek_itinerary
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
);

-- Trek Itinerary: Users can UPDATE if they own the trek
CREATE POLICY itinerary_update ON public.trek_itinerary
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
);

-- Trek Itinerary: Users can DELETE if they own the trek
CREATE POLICY itinerary_delete ON public.trek_itinerary
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.treks WHERE id = trek_itinerary.trek_id AND guide_id = auth.uid())
);
