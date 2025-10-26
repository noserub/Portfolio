-- Fix missing projects RLS policies
-- This migration adds the missing INSERT, UPDATE, and DELETE policies for projects

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create the missing policies for projects
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE
  USING ((select auth.uid()) = user_id);
