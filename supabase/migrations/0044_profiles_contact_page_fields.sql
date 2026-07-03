-- Contact page copy on the canonical portfolio owner profile (public visitors + CMS).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_page_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS contact_location TEXT;

COMMENT ON COLUMN public.profiles.contact_page_subtitle IS 'Subtitle below the Contact page headline (modern theme).';
COMMENT ON COLUMN public.profiles.contact_location IS 'Location shown on the Contact page info card.';
