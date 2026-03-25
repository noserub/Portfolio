-- Optional decorative icons for case study UI (sidebars, galleries, My role cards). Off by default.
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS case_study_decorative_icons BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.case_study_decorative_icons IS 'When true, show Lucide icons on sidebars, media sections, and My role subsection cards.';
