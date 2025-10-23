-- Optimize RLS policies for better performance
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation per row

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can insert their own contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can view their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can insert their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can update their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can delete their own music playlist" ON music_playlist;
DROP POLICY IF EXISTS "Users can view their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can insert their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can update their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can delete their own visuals gallery" ON visuals_gallery;
DROP POLICY IF EXISTS "Users can view their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can insert their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can update their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can delete their own seo data" ON seo_data;
DROP POLICY IF EXISTS "Users can view their own page visibility" ON page_visibility;
DROP POLICY IF EXISTS "Users can update their own page visibility" ON page_visibility;
DROP POLICY IF EXISTS "Users can view their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete their own app settings" ON app_settings;

-- Create optimized policies for profiles
CREATE POLICY "Users can insert their own profile" ON profiles 
FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can delete own profile" ON profiles 
FOR DELETE USING ((select auth.uid()) = id);

-- Create optimized policies for projects
CREATE POLICY "Users can view their own projects" ON projects 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own projects" ON projects 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own projects" ON projects 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own projects" ON projects 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized policies for contact_messages
CREATE POLICY "Users can view their own contact messages" ON contact_messages 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own contact messages" ON contact_messages 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized policies for music_playlist
CREATE POLICY "Users can view their own music playlist" ON music_playlist 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own music playlist" ON music_playlist 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own music playlist" ON music_playlist 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own music playlist" ON music_playlist 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized policies for visuals_gallery
CREATE POLICY "Users can view their own visuals gallery" ON visuals_gallery 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own visuals gallery" ON visuals_gallery 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own visuals gallery" ON visuals_gallery 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own visuals gallery" ON visuals_gallery 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized policies for seo_data
CREATE POLICY "Users can view their own seo data" ON seo_data 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own seo data" ON seo_data 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own seo data" ON seo_data 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own seo data" ON seo_data 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Create optimized policies for page_visibility
CREATE POLICY "Users can view their own page visibility" ON page_visibility 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own page visibility" ON page_visibility 
FOR UPDATE USING ((select auth.uid()) = user_id);

-- Create optimized policies for app_settings
CREATE POLICY "Users can view their own app settings" ON app_settings 
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own app settings" ON app_settings 
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own app settings" ON app_settings 
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own app settings" ON app_settings 
FOR DELETE USING ((select auth.uid()) = user_id);

-- Add comment explaining the optimization
COMMENT ON POLICY "Users can insert their own profile" ON profiles IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row';
COMMENT ON POLICY "Users can delete own profile" ON profiles IS 'Optimized RLS policy using (select auth.uid()) to prevent re-evaluation per row';
