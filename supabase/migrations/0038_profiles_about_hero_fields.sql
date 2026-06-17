-- Modern About hero (Section 1): headline + lead, separate from bio card paragraphs.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS about_hero_headline TEXT,
  ADD COLUMN IF NOT EXISTS about_hero_lead TEXT;

COMMENT ON COLUMN public.profiles.about_hero_headline IS 'About page hero headline (modern Section 1 h1).';
COMMENT ON COLUMN public.profiles.about_hero_lead IS 'About page hero lead paragraph (modern Section 1 subhead).';
