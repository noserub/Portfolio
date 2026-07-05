-- Optional crop frame for hero_image: { "scale": 1.2, "position": { "x": 50, "y": 30 } }
ALTER TABLE public.writing_posts
  ADD COLUMN IF NOT EXISTS hero_image_crop JSONB DEFAULT NULL;

COMMENT ON COLUMN public.writing_posts.hero_image_crop IS
  'Crop frame for hero_image: scale + position (%). Used on index cards and magazine post banner.';
