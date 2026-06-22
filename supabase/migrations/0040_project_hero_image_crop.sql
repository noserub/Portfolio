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
CREATE OR REPLACE FUNCTION public._projects_mask_for_public(p public.projects)
RETURNS public.projects
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF NOT COALESCE(p.requires_password, false) THEN
    RETURN p;
  END IF;
  RETURN (
    p.id,
    p.created_at,
    p.updated_at,
    p.user_id,
    p.title,
    p.description,
    p.url,
    p.position_x,
    p.position_y,
    p.scale,
    p.published,
    p.requires_password,
    NULL::text,
    NULL::text,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    p.gallery_aspect_ratio,
    p.flow_diagram_aspect_ratio,
    p.video_aspect_ratio,
    p.gallery_columns,
    p.flow_diagram_columns,
    p.video_columns,
    p.project_images_position,
    p.videos_position,
    p.flow_diagrams_position,
    p.solution_cards_position,
    '{}'::jsonb,
    p.sort_order,
    '{}'::jsonb,
    p.key_features_columns,
    p.project_type,
    p.case_study_decorative_icons,
    '[]'::jsonb,
    p.hero_scale,
    p.hero_position_x,
    p.hero_position_y
  )::public.projects;
END;
$$;
