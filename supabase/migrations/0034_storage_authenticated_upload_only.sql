-- P4: Revert public INSERT on portfolio-images; uploads require Supabase auth (anon was abusable).
-- Idempotent: some DBs never ran 0003 (so the authenticated policy still exists); drop both then recreate.

DROP POLICY IF EXISTS "Public can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND auth.role() = 'authenticated'
);
