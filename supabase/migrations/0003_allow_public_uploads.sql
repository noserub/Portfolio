-- Allow public uploads to portfolio-images bucket
-- This allows unauthenticated users to upload images for testing

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Create a new policy that allows public uploads
CREATE POLICY "Public can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'portfolio-images');

-- Keep the existing policies for updates and deletes (these still require auth)
-- But allow public uploads for testing purposes
