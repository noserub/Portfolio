-- External CTAs for case studies (e.g. "Try live site", "Design system").
-- Row-based _projects_mask_for_public (0041) passes this through for public projects.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_links JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.project_links IS
  'Array of { label, href, variant: primary|secondary|ghost } — rendered below hero on case study detail.';

-- Seed flACID CTAs (Option B: live site + design system; no Stage link).
UPDATE public.projects
SET project_links = '[
  {"label": "Try live site", "href": "https://flacid.vercel.app", "variant": "primary"},
  {"label": "Design system", "href": "https://flacid.vercel.app/design-system", "variant": "secondary"}
]'::jsonb
WHERE title ILIKE '%flACID%'
  AND (project_links IS NULL OR project_links = '[]'::jsonb);
