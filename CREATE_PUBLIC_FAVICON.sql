-- Create public favicon record using your existing favicon
-- Run this in your Supabase SQL Editor

-- First, let's see what favicon you have for your user
SELECT user_id, favicon_url FROM app_settings WHERE user_id = 'e9c16b1f-60e0-4e46-b816-1d76790bf58d';

-- Then create the public record with the same favicon
-- Use a UUID for the public user_id
INSERT INTO app_settings (user_id, favicon_url, theme, is_authenticated, show_debug_panel)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, (SELECT favicon_url FROM app_settings WHERE user_id = 'e9c16b1f-60e0-4e46-b816-1d76790bf58d'), 'dark', false, false)
ON CONFLICT (user_id) DO UPDATE SET 
  favicon_url = EXCLUDED.favicon_url,
  updated_at = NOW();
