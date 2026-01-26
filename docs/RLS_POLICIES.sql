-- RLS_POLICIES.sql
-- Run this AFTER creating the tables from INITIAL_SUPABASE_SETUP.sql

-- Enable Row Level Security on tables
ALTER TABLE public.treks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trek_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies so the site can read treks and itineraries
DROP POLICY IF EXISTS treks_select ON public.treks;
CREATE POLICY treks_select ON public.treks
FOR SELECT
USING (true);

DROP POLICY IF EXISTS trek_itinerary_select ON public.trek_itinerary;
CREATE POLICY trek_itinerary_select ON public.trek_itinerary
FOR SELECT
USING (true);

-- Profiles: allow users to SELECT their own profile; allow admins to SELECT any profile
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- Profiles: allow users to UPDATE only their profile; admins can update any
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Treks: allow INSERT if authenticated and guide_id = auth.uid() OR admin
DROP POLICY IF EXISTS treks_insert ON public.treks;
CREATE POLICY treks_insert ON public.treks
FOR INSERT
WITH CHECK (
  (guide_id IS NOT NULL AND guide_id = auth.uid())
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Treks: allow UPDATE/DELETE if owner (guide_id) or admin
DROP POLICY IF EXISTS treks_update_delete ON public.treks;
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

DROP POLICY IF EXISTS treks_delete ON public.treks;
CREATE POLICY treks_delete ON public.treks
FOR DELETE
USING (
  (guide_id IS NOT NULL AND guide_id = auth.uid())
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Itinerary: allow INSERT/UPDATE/DELETE only by trek owner (guide) or admin
DROP POLICY IF EXISTS itinerary_modify ON public.trek_itinerary;
DROP POLICY IF EXISTS itinerary_insert ON public.trek_itinerary;
CREATE POLICY itinerary_insert ON public.trek_itinerary
FOR INSERT
WITH CHECK (
  ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

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

DROP POLICY IF EXISTS itinerary_delete ON public.trek_itinerary;
CREATE POLICY itinerary_delete ON public.trek_itinerary
FOR DELETE
USING (
  ((SELECT guide_id FROM public.treks WHERE id = trek_itinerary.trek_id) = auth.uid())
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Registrations: allow INSERT by authenticated users; allow guides/admins to SELECT registrations for their treks
DROP POLICY IF EXISTS registrations_insert ON public.registrations;
CREATE POLICY registrations_insert ON public.registrations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS registrations_select ON public.registrations;
CREATE POLICY registrations_select ON public.registrations
FOR SELECT
USING (
  -- allow the registrant to see their own row
  (user_id IS NOT NULL AND user_id = auth.uid())
  -- OR allow guide/admin to see registrations for their treks
  OR ((SELECT guide_id FROM public.treks WHERE id = registrations.trek_id) = auth.uid())
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Important notes:
-- - Run these policies after you have created at least one admin profile whose id matches an Auth user id.
-- - In the Supabase Table Editor you can create an Auth user (Auth → Users) then insert a row into public.profiles
--   with id = that auth user's id, role = 'admin', approved = true.
-- - If you prefer to manage admins from the UI, you can create a simple server action to promote a user; otherwise use Table Editor.
