-- Add JSONB column to store stable sidebar content
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS case_study_sidebars JSONB DEFAULT '{}'::jsonb;


