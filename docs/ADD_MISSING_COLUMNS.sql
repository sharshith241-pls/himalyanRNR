-- ADD_MISSING_COLUMNS.sql
-- Run this in the Supabase SQL Editor to add missing columns to the treks table

-- Add missing columns if they don't exist
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'Easy';
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS category text DEFAULT 'himalayan-treks';
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.treks ADD COLUMN IF NOT EXISTS description text;

-- Verify the table has all required columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'treks';
