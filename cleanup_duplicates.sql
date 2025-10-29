-- Clean up duplicate projects - keep only the most recent version of each
-- Run this SQL directly in your Supabase SQL Editor

-- Delete duplicate MassRoots case studies (keep the one with requires_password = true)
DELETE FROM projects 
WHERE title = 'MassRoots case study' 
AND id NOT IN (
  SELECT id FROM projects 
  WHERE title = 'MassRoots case study' 
  AND requires_password = true 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Delete duplicate Skype Qik case studies (keep the most recent one)
DELETE FROM projects 
WHERE title = 'Skype Qik case study' 
AND id NOT IN (
  SELECT id FROM projects 
  WHERE title = 'Skype Qik case study' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Delete duplicate Tandem Diabetes Care case studies (keep the most recent one)
DELETE FROM projects 
WHERE title = 'Tandem Diabetes Care' 
AND id NOT IN (
  SELECT id FROM projects 
  WHERE title = 'Tandem Diabetes Care' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Verify only one of each project remains
SELECT id, title, requires_password, password, created_at FROM projects ORDER BY title, created_at DESC;

