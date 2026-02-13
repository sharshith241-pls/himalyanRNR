-- ALLOW_ADMIN_TREK_POLICIES.sql
-- Run in Supabase SQL editor to allow admins to update/delete treks (non-recursive)

-- Drop existing treks_update and treks_delete policies if present
DROP POLICY IF EXISTS treks_update ON public.treks;
DROP POLICY IF EXISTS treks_delete ON public.treks;

-- Create a policy that allows the trek owner or admins to update treks
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

-- Allow delete for owner or admin
CREATE POLICY treks_delete ON public.treks
FOR DELETE
USING (
  (guide_id IS NOT NULL AND guide_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
