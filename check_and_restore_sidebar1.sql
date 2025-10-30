-- Check current state of Sidebar 1 in the database
-- Replace the project ID with your actual project ID

-- 1. Check if Sidebar 1 exists in JSON
SELECT 
  id,
  title,
  case_study_sidebars->'atGlance' as sidebar1_json,
  case_study_sidebars->'atGlance'->>'content' as sidebar1_content,
  case_study_sidebars->'atGlance'->>'title' as sidebar1_title,
  case_study_sidebars->'atGlance'->>'hidden' as sidebar1_hidden
FROM public.projects
WHERE id = '033832bd-1194-4405-a6e5-12bfb4f71548';

-- 2. Check if Sidebar 1 exists in markdown (before cleanup)
SELECT 
  id,
  title,
  CASE 
    WHEN case_study_content LIKE '%# At a glance%' OR case_study_content LIKE '%# Sidebar 1%' 
    THEN 'EXISTS IN MARKDOWN'
    ELSE 'NOT IN MARKDOWN'
  END as sidebar1_in_markdown,
  substring(
    case_study_content from 
    '.*#\s*(At a glance|Sidebar 1)\s*\n([\s\S]*?)(?=\n#\s|\n?$)'
  ) as sidebar1_extract
FROM public.projects
WHERE id = '033832bd-1194-4405-a6e5-12bfb4f71548';

-- 3. If Sidebar 1 exists in markdown but not in JSON, restore it:
-- (Run this ONLY if step 2 shows Sidebar 1 exists in markdown)
UPDATE public.projects
SET case_study_sidebars = jsonb_set(
  COALESCE(case_study_sidebars, '{}'::jsonb),
  '{atGlance}',
  jsonb_build_object(
    'title', 'Sidebar 1',
    'content', regexp_replace(
      regexp_replace(
        substring(
          case_study_content from 
          '(?s)#\s*(At a glance|Sidebar 1)\s*\n(.*?)(?=\n#\s|\Z)'
        ),
        '^#\s*(At a glance|Sidebar 1)\s*\n?',
        ''
      ),
      '\n+$',
      ''
    ),
    'hidden', false
  ),
  true
)
WHERE id = '033832bd-1194-4405-a6e5-12bfb4f71548'
  AND (case_study_sidebars->'atGlance'->>'content' IS NULL 
       OR case_study_sidebars->'atGlance'->>'content' = '')
  AND (case_study_content LIKE '%# At a glance%' 
       OR case_study_content LIKE '%# Sidebar 1%');

-- 4. Verify the restore worked
SELECT 
  id,
  title,
  case_study_sidebars->'atGlance'->>'content' as sidebar1_restored_content
FROM public.projects
WHERE id = '033832bd-1194-4405-a6e5-12bfb4f71548';

