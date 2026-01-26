-- Create `profiles` table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile (auth.uid must match id)
CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to select their own profile or admins to select all
CREATE POLICY "Profiles: select own or admin" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Allow users to update their own profile (excluding role/approved)
CREATE POLICY "Profiles: update own or admin" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((auth.uid() = id AND (role = old.role OR role IS NOT DISTINCT FROM old.role)) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Note: The WITH CHECK above prevents users from elevating their own role. Admins can update any field.

-- Create a central registrations table (recommended over per-trek tables)
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to insert registrations for themselves
CREATE POLICY "Registrations: insert own" ON public.registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own registrations, guides to select registrations for their treks, and admins to select all
CREATE POLICY "Registrations: select" ON public.registrations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p JOIN public.treks t ON t.guide_id = p.id WHERE p.id = auth.uid() AND t.id = public.registrations.trek_id
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Allow guides to manage treks they own and admins to manage all treks
-- Ensure treks table has guide_id referencing profiles.id
ALTER TABLE IF EXISTS public.treks
  ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES public.profiles(id);

ALTER TABLE IF EXISTS public.treks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Treks: insert by guide or admin" ON public.treks
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('guide','admin')
  );

CREATE POLICY IF NOT EXISTS "Treks: select public or owner/admin" ON public.treks
  FOR SELECT
  USING (
    public.treks.id IS NOT NULL
  );

CREATE POLICY IF NOT EXISTS "Treks: update by owner or admin" ON public.treks
  FOR UPDATE
  USING (
    (guide_id IS NOT NULL AND guide_id = (SELECT id FROM public.profiles WHERE id = auth.uid()))
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY IF NOT EXISTS "Treks: delete by owner or admin" ON public.treks
  FOR DELETE
  USING (
    (guide_id IS NOT NULL AND guide_id = (SELECT id FROM public.profiles WHERE id = auth.uid()))
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- IMPORTANT: After running these SQL statements, create at least one admin entry manually in `profiles` using the auth user's id (from Authentication > Users) so admins can manage approvals.
-- Example (run once from SQL editor using your admin's auth user id):
-- INSERT INTO public.profiles (id, email, full_name, role, approved) VALUES ('<AUTH_USER_ID>', 'admin@example.com', 'Site Admin', 'admin', true);
