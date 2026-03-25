-- Public resume / CV link for the About page (editable in CMS)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_url TEXT;

COMMENT ON COLUMN public.profiles.resume_url IS 'URL for the Resume button on the About page (e.g. PDF or Google Drive).';
