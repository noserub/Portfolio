-- Separate crop/zoom for case study detail hero vs home/card thumbnail.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hero_scale DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS hero_position_x DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS hero_position_y DECIMAL(5,2);

COMMENT ON COLUMN public.projects.hero_scale IS
  'Zoom for case study detail hero image. NULL falls back to card scale.';
COMMENT ON COLUMN public.projects.hero_position_x IS
  'Horizontal focal point (%) for detail hero. NULL falls back to card position_x.';
COMMENT ON COLUMN public.projects.hero_position_y IS
  'Vertical focal point (%) for detail hero. NULL falls back to card position_y.';

-- Password-gated public RPC: include hero crop (not sensitive); keep masking case-study payloads.
-- Uses row assignment — safe when columns are added; do not use manual tuple casts.
CREATE OR REPLACE FUNCTION public._projects_mask_for_public(p public.projects)
RETURNS public.projects
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result public.projects;
BEGIN
  IF NOT COALESCE(p.requires_password, false) THEN
    RETURN p;
  END IF;

  result := p;
  result.password := NULL;
  result.case_study_content := NULL;
  result.case_study_images := '[]'::jsonb;
  result.flow_diagram_images := '[]'::jsonb;
  result.video_items := '[]'::jsonb;
  result.section_positions := '{}'::jsonb;
  result.case_study_sidebars := '{}'::jsonb;
  result.case_study_sections := '[]'::jsonb;

  RETURN result;
END;
$$;
