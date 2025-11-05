-- Add project_type field to projects table
-- This allows filtering projects by type: AI, Full Stack Web Apps, Product Design

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type TEXT 
CHECK (project_type IS NULL OR project_type IN ('product-design', 'development', 'branding'));

-- Add comment for documentation
COMMENT ON COLUMN projects.project_type IS 'Project type filter: product-design, development, or branding';

