-- Repeatable case study gallery sections (unified image/video galleries with custom titles)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS case_study_sections JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.projects.case_study_sections IS
  'Ordered gallery sections: [{ id, type: gallery, title, position, visible, gallery: { mediaMode, imageItems, videoItems, columns, aspectRatio, previewLimit } }]';

-- Password-gated public RPC: strip gallery section payloads for protected projects
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
    '[]'::jsonb
  )::public.projects;
END;
$$;
