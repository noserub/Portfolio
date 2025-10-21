-- Fix RLS policies for app_settings to allow public access for main user
-- This allows the logo and favicon to load for all visitors

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON app_settings;

-- Create new policies that allow public access to app_settings
-- This is needed so logo and favicon can load for all visitors
CREATE POLICY "Public app settings are viewable by everyone" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own settings" ON app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON app_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON app_settings FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to insert/update app_settings for main user
-- This is needed for the "Create Settings" button to work
CREATE POLICY "Service role can manage all app settings" ON app_settings FOR ALL USING (auth.role() = 'service_role');
