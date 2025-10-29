-- Comprehensive fix for password protection with bypass authentication
-- This migration completely fixes the RLS policies to work with the bypass auth system

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Allow updates with fallback user ID" ON projects;
DROP POLICY IF EXISTS "Allow inserts with fallback user ID" ON projects;

-- Create new policies that work with both authenticated users and bypass authentication
CREATE POLICY "Projects update policy" ON projects
  FOR UPDATE
  USING (
    -- Allow updates for authenticated users on their own projects
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    -- Allow updates for projects with the fallback user ID (bypass auth)
    user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

CREATE POLICY "Projects insert policy" ON projects
  FOR INSERT
  WITH CHECK (
    -- Allow inserts for authenticated users
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    -- Allow inserts with the fallback user ID (bypass auth)
    user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

CREATE POLICY "Projects delete policy" ON projects
  FOR DELETE
  USING (
    -- Allow deletes for authenticated users on their own projects
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    -- Allow deletes for projects with the fallback user ID (bypass auth)
    user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

