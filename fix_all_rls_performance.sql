-- Comprehensive RLS Performance Fix
-- This script addresses both auth RLS initialization and multiple permissive policies

-- ==============================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN ISSUES
-- ==============================================

-- Fix contact_messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON contact_messages;

CREATE POLICY "Users can view their own messages" ON contact_messages
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own messages" ON contact_messages
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own messages" ON contact_messages
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix music_playlist policies
DROP POLICY IF EXISTS "Users can insert their own music" ON music_playlist;
DROP POLICY IF EXISTS "Users can update their own music" ON music_playlist;
DROP POLICY IF EXISTS "Users can delete their own music" ON music_playlist;

CREATE POLICY "Users can insert their own music" ON music_playlist
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own music" ON music_playlist
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own music" ON music_playlist
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix visuals_gallery policies
DROP POLICY IF EXISTS "Users can insert their own visuals" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can update their own visuals" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can delete their own visuals" ON visuals_gallery;

CREATE POLICY "Users can insert their own visuals" ON visuals_gallery
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own visuals" ON visuals_gallery
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own visuals" ON visuals_gallery
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix seo_data policies
DROP POLICY IF EXISTS "Users can insert their own SEO data" ON seo_data;
DROP POLICY IF EXISTS "Users can update their own SEO data" ON seo_data;
DROP POLICY IF EXISTS "Users can delete their own SEO data" ON seo_data;

CREATE POLICY "Users can insert their own SEO data" ON seo_data
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own SEO data" ON seo_data
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own SEO data" ON seo_data
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix page_visibility policies
DROP POLICY IF EXISTS "Users can insert their own page visibility" ON page_visibility;
DROP POLICY IF EXISTS "Users can delete their own page visibility" ON page_visibility;

CREATE POLICY "Users can insert their own page visibility" ON page_visibility
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own page visibility" ON page_visibility
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix app_settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON app_settings;

CREATE POLICY "Users can view their own settings" ON app_settings
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own settings" ON app_settings
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings" ON app_settings
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own settings" ON app_settings
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Fix projects policies
DROP POLICY IF EXISTS "Authenticated users can view all published projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Authenticated users can view all published projects" ON projects
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL AND published = true);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ==============================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES
-- ==============================================

-- Remove duplicate app_settings policies
DROP POLICY IF EXISTS "Users can view their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete their own app settings" ON app_settings;

-- Remove duplicate contact_messages policies
DROP POLICY IF EXISTS "Users can view their own contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can insert their own contact messages" ON contact_messages;

-- Remove duplicate music_playlist policies
DROP POLICY IF EXISTS "Users can view their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can insert their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can update their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can delete their own music playlist" ON music_playlist;

-- Remove duplicate page_visibility policies
DROP POLICY IF EXISTS "Users can view their own page visibility" ON page_visibility;

-- Remove duplicate projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

-- Remove duplicate seo_data policies
DROP POLICY IF EXISTS "Users can view their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can insert their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can update their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can delete their own seo data" ON seo_data;

-- Remove duplicate visuals_gallery policies
DROP POLICY IF EXISTS "Users can view their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can insert their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can update their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can delete their own visuals gallery" ON visuals_gallery;

-- ==============================================
-- 3. ADD PUBLIC ACCESS FOR FALLBACK USER
-- ==============================================

-- Add public access for page_visibility fallback user
CREATE POLICY "Allow public read access to fallback user page visibility" ON page_visibility
  FOR SELECT
  USING (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055');

CREATE POLICY "Allow public insert for fallback user page visibility" ON page_visibility
  FOR INSERT
  WITH CHECK (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055');

CREATE POLICY "Allow public update for fallback user page visibility" ON page_visibility
  FOR UPDATE
  USING (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055')
  WITH CHECK (user_id = '7cd2752f-93c5-46e6-8535-32769fb10055');

-- ==============================================
-- 4. VERIFY POLICIES
-- ==============================================

-- Check remaining policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
