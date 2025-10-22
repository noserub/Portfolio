-- Add favicon_url column to app_settings table
-- This is the only change we need for favicon upload to work

ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.favicon_url IS 'URL of the favicon image stored in Supabase Storage';
