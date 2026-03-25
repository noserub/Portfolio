-- Idempotent repair if 0028/0029 were never applied on a given database (fixes PostgREST 400 on PATCH).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS about_highlights_leadership_decorative_icons BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resume_url TEXT;
