-- Manual fix for password protection
-- Run this SQL directly in your Supabase SQL editor

-- Update Skype Qik case study to enable password protection
UPDATE projects 
SET 
  requires_password = true,
  password = '0p3n',
  updated_at = NOW()
WHERE 
  title = 'Skype Qik case study' 
  AND user_id = '7cd2752f-93c5-46e6-8535-32769fb10055';

-- Verify the update worked
SELECT id, title, requires_password, password 
FROM projects 
WHERE title = 'Skype Qik case study';

