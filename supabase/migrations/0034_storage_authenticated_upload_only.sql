-- P4: Revert public INSERT on portfolio-images; uploads require Supabase auth (anon was abusable).

DROP POLICY IF EXISTS "Public can upload images" ON storage.objects;

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND auth.role() = 'authenticated'
);
