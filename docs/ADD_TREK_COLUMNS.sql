-- Migration: add trek detail columns required by admin UI
-- Run this in your Supabase SQL editor or via psql against the project database.

BEGIN;

-- Add text columns if they don't already exist
ALTER TABLE public.treks
  ADD COLUMN IF NOT EXISTS itinerary text;

ALTER TABLE public.treks
  ADD COLUMN IF NOT EXISTS included text;

ALTER TABLE public.treks
  ADD COLUMN IF NOT EXISTS not_included text;

ALTER TABLE public.treks
  ADD COLUMN IF NOT EXISTS important_info text;

-- Backfill NULLs to empty string for predictable front-end rendering
UPDATE public.treks SET itinerary = '' WHERE itinerary IS NULL;
UPDATE public.treks SET included = '' WHERE included IS NULL;
UPDATE public.treks SET not_included = '' WHERE not_included IS NULL;
UPDATE public.treks SET important_info = '' WHERE important_info IS NULL;

COMMIT;

-- Notes:
-- 1) If your project enables Row Level Security (RLS) on `treks`, ensure existing
--    policies do not explicitly reference a column list that excludes these fields.
-- 2) After applying this migration, refresh the Supabase dashboard (Schema cache)
--    or restart any server-side services that cache the DB schema so the new
--    columns are recognized by the API.
-- 3) If you prefer a single ALTER statement, you can combine additions, but
--    IF NOT EXISTS is used above to make the script idempotent.
