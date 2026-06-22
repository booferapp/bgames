-- =============================================================================
-- STORAGE BUCKETS SETUP FOR BOOFER GAMES PLATFORM
-- =============================================================================
-- This script creates two storage buckets:
-- 1. game-files: For storing HTML game files (50MB limit)
-- 2. banners: For storing game banner images (5MB limit)
--
-- Run this in your Supabase SQL Editor or use:
-- supabase db execute -f setup_storage_buckets.sql --linked
-- =============================================================================

-- Create storage bucket for HTML game files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-files',
  'game-files',
  true,
  52428800, -- 50MB limit
  ARRAY['text/html', 'application/javascript', 'text/javascript', 'application/json', 'text/css']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES FOR GAME-FILES BUCKET
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own game files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own game files" ON storage.objects;

-- Allow public read access to game files
CREATE POLICY "Public read access for game files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-files');

-- Allow authenticated users to upload game files
CREATE POLICY "Authenticated users can upload game files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-files');

-- Allow users to update their own game files
CREATE POLICY "Users can update their own game files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own game files
CREATE POLICY "Users can delete their own game files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- STORAGE POLICIES FOR BANNERS BUCKET
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;

-- Allow public read access to banners
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Allow authenticated users to upload banners
CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Allow users to update their own banners
CREATE POLICY "Users can update their own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own banners
CREATE POLICY "Users can delete their own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('game-files', 'banners')
ORDER BY id;

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND (policyname LIKE '%game files%' OR policyname LIKE '%banners%')
ORDER BY policyname;
