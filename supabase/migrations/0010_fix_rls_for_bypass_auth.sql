-- Comprehensive fix for password protection updates
-- This migration fixes RLS policies to allow updates with the fallback user ID

-- First, let's check what policies exist and drop conflicting ones
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Allow updates with fallback user ID" ON projects;
DROP POLICY IF EXISTS "Allow inserts with fallback user ID" ON projects;

-- Create new policies that work with both authenticated users and the fallback user ID
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid)
  );

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid)
  );

-- Also ensure we can delete projects with the fallback user ID
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid)
  );

