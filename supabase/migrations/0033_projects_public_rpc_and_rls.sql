-- P3: Password-gated case studies must not expose hashes or full payloads to anonymous API users.
-- Owner keeps full access via RLS (auth.uid() = user_id). Signed-out clients use SECURITY DEFINER RPCs.

DROP POLICY IF EXISTS "Published projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view all published projects" ON public.projects;
DROP POLICY IF EXISTS "Public non-password-protected projects are viewable by everyone" ON public.projects;

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
    p.case_study_decorative_icons
  )::public.projects;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_projects_public()
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public._projects_mask_for_public(p)
  FROM public.projects p
  WHERE p.published = true
  ORDER BY p.sort_order ASC NULLS LAST, p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_project_by_id_public(p_id uuid)
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public._projects_mask_for_public(p)
  FROM public.projects p
  WHERE p.id = p_id AND p.published = true;
$$;

CREATE OR REPLACE FUNCTION public.unlock_project_with_password(p_project_id uuid, p_password text)
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.projects p
  WHERE p.id = p_project_id
    AND p.published = true
    AND COALESCE(p.requires_password, false) = true
    AND COALESCE(NULLIF(BTRIM(p.password), ''), '0p3n') = p_password;
$$;

REVOKE ALL ON FUNCTION public._projects_mask_for_public(public.projects) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_projects_public() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_project_by_id_public(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlock_project_with_password(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_projects_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_by_id_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_project_with_password(uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_projects_public() IS
  'Anonymous-safe published projects: strips passwords and case-study payloads when requires_password is true.';
COMMENT ON FUNCTION public.unlock_project_with_password(uuid, text) IS
  'Returns full published row only when requires_password and plaintext matches stored (or default 0p3n).';
