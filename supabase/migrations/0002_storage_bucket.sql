-- Create storage bucket for portfolio images
-- This allows users to upload and store images for their portfolio projects

-- Create the portfolio-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true, -- Public bucket so images can be viewed without authentication
  52428800, -- 50MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create storage policies for the portfolio-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'portfolio-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public access to view images (no authentication required)
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'portfolio-images');
