-- Fix get_projects_public / get_project_by_id_public after 0040 broke tuple casting.
-- Root cause: manual (col1, col2, ...)::projects tuples drift when columns are added out of order.
-- Use row assignment so masking stays correct regardless of column order.

-- Unified galleries column (0039) may be missing if only 0040 was applied in the SQL editor.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS case_study_sections JSONB NOT NULL DEFAULT '[]'::jsonb;

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
