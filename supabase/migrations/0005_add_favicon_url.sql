-- Add favicon_url column to app_settings table
ALTER TABLE app_settings 
ADD COLUMN favicon_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.favicon_url IS 'URL of the favicon image stored in Supabase Storage';
