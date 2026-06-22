-- =============================================================================
-- FIX STORAGE BUCKETS - Delete and Recreate Properly
-- =============================================================================

-- First, delete all policies for these buckets
DROP POLICY IF EXISTS "Public read access for game files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own game files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own game files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;

-- Delete the buckets completely
DELETE FROM storage.buckets WHERE id = 'game-files';
DELETE FROM storage.buckets WHERE id = 'banners';

-- Recreate game-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection, created_at, updated_at)
VALUES (
  'game-files',
  'game-files',
  true,
  52428800,
  ARRAY['text/html', 'application/javascript', 'text/javascript', 'application/json', 'text/css'],
  false,
  NOW(),
  NOW()
);

-- Recreate banners bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection, created_at, updated_at)
VALUES (
  'banners',
  'banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  false,
  NOW(),
  NOW()
);

-- =============================================================================
-- RECREATE STORAGE POLICIES
-- =============================================================================

-- Game-files policies
CREATE POLICY "Public read access for game files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game-files');

CREATE POLICY "Authenticated users can upload game files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-files');

CREATE POLICY "Users can update their own game files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own game files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Banners policies
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Users can update their own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify
SELECT id, name, public, file_size_limit, created_at, updated_at 
FROM storage.buckets 
WHERE id IN ('game-files', 'banners')
ORDER BY id;
