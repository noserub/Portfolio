-- Fix password protection updates for bypass authentication
-- This migration allows updates to projects using the fallback user ID

-- Add a policy to allow updates using the fallback user ID for bypass authentication
CREATE POLICY "Allow updates with fallback user ID" ON projects
  FOR UPDATE
  USING (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid);

-- Also allow inserts with the fallback user ID
CREATE POLICY "Allow inserts with fallback user ID" ON projects
  FOR INSERT
  WITH CHECK (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid);

