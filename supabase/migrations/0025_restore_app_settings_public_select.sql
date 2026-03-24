-- Restore anonymous SELECT on app_settings for favicon_url, logo_url, etc.
--
-- Migration 0005_optimize_rls_policies replaced the prior "public SELECT" pattern with
-- SELECT USING (auth.uid() = user_id) only. That blocks unauthenticated clients from
-- reading any row, so getFaviconFromSupabase() always returns null for visitors
-- (Vercel preview, production incognito, etc.).
--
-- Re-add the same policy name used in 0004_fix_app_settings_rls.sql.

DROP POLICY IF EXISTS "Public app settings are viewable by everyone" ON app_settings;

CREATE POLICY "Public app settings are viewable by everyone" ON app_settings
FOR SELECT USING (true);
