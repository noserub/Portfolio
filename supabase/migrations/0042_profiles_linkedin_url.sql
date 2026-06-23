-- Public LinkedIn profile URL (Contact page + site chrome)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL for Contact page and footer links.';
