-- INITIAL_SUPABASE_SETUP.sql
-- Run these statements in your new Supabase project's SQL editor (run as project SQL owner)
-- 1) Enable pgcrypto (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Profiles table (stores roles and approved flag)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  role text DEFAULT 'user', -- 'user' | 'guide' | 'admin'
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3) Treks table
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

-- 4) Trek itinerary items
CREATE TABLE IF NOT EXISTS public.trek_itinerary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  day integer NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 5) Registrations / bookings
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trek_id uuid REFERENCES public.treks(id) ON DELETE CASCADE,
  user_id uuid, -- optional reference to profiles.id
  user_name text,
  user_email text,
  seats integer DEFAULT 1,
  amount_paid numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6) Helpful example: create an admin profile row (DO NOT run until you know the auth user id)
-- Replace 'ADMIN_AUTH_USER_ID' and email/fullname before running. This inserts an admin profile that matches an Auth user id.
-- INSERT INTO public.profiles (id, email, full_name, role, approved, created_at)
-- VALUES ('ADMIN_AUTH_USER_ID','admin@example.com','Admin Name','admin',true,now());

-- 7) Optional: create a sample trek (replace GUIDE_PROFILE_ID if you want it assigned)
-- INSERT INTO public.treks (title, location, description, price, category, guide_id)
-- VALUES ('Sample Trek','KATHMANDU','Demo trek description', 1999, 'himalayan', 'GUIDE_PROFILE_ID');

-- NOTES:
-- - Do not create admin accounts via the public register endpoint. Create a normal user (Auth -> Users) and then add a matching profiles row with role='admin' and approved=true using the Table Editor or the statement above with the exact auth user id.
-- - The SQL for RLS policies is in docs/RLS_POLICIES.sql (run after you create tables and verify profile ids).
