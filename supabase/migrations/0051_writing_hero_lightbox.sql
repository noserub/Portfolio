-- Optional click-to-expand lightbox for Magazine layout hero banner
ALTER TABLE public.writing_posts
  ADD COLUMN IF NOT EXISTS hero_image_lightbox BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.writing_posts.hero_image_lightbox IS
  'When true, the Magazine layout hero banner opens in a lightbox on click.';
