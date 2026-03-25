-- Optional decorative icons on About page: Highlights and Leadership & Impact cards. Off by default.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS about_highlights_leadership_decorative_icons BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.about_highlights_leadership_decorative_icons IS 'When true, show Lucide icons on Highlights and Leadership & Impact cards.';
