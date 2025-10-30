-- Add key_features_columns column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS key_features_columns INTEGER DEFAULT 3;

-- Update existing projects to have default value
UPDATE public.projects
SET key_features_columns = 3
WHERE key_features_columns IS NULL;

