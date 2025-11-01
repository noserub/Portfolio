-- Allow video file uploads to portfolio-images bucket
-- This extends the bucket configuration to support video files for case studies

-- Update the portfolio-images bucket to allow video MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp', 
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg'
]
WHERE id = 'portfolio-images';

-- Increase file size limit to 200MB to accommodate video files
-- (videos are typically larger than images)
UPDATE storage.buckets
SET file_size_limit = 209715200 -- 200MB
WHERE id = 'portfolio-images';

