-- Fix RLS policies for password-protected projects
-- This migration updates the projects table RLS policies to properly handle password protection

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;

-- Create a new policy that respects password protection
-- Only show published projects that don't require a password to anonymous users
CREATE POLICY "Public non-password-protected projects are viewable by everyone" 
ON projects FOR SELECT 
USING (published = true AND requires_password = false);

-- Keep the existing policy for authenticated users to view their own projects
-- (This policy already exists, but we'll ensure it's still there)
CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

-- Add a new policy to allow viewing password-protected projects for authenticated users
-- This allows the site owner to view all projects when authenticated
CREATE POLICY "Authenticated users can view all published projects" 
ON projects FOR SELECT 
USING (published = true AND auth.uid() IS NOT NULL);
