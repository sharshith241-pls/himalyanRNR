-- STORAGE_POLICY_FIX.sql
-- Run this in the Supabase SQL Editor to fix the trek-images storage policies
-- This will allow authenticated users to upload, update, and delete images

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to insert images" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder" ON storage.objects;

-- Create simplified policies that actually work

-- Policy 1: Allow public read access to trek-images
CREATE POLICY "Public read trek-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'trek-images');

-- Policy 2: Allow authenticated users to upload to trek-images
CREATE POLICY "Authenticated upload trek-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'trek-images'
    AND auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to update in trek-images
CREATE POLICY "Authenticated update trek-images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'trek-images' AND auth.role() = 'authenticated');

-- Policy 4: Allow authenticated users to delete from trek-images
CREATE POLICY "Authenticated delete trek-images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'trek-images' AND auth.role() = 'authenticated');
