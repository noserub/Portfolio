-- Create public favicon record using your existing favicon
-- Run this in your Supabase SQL Editor

-- First, let's see what favicon you have for your user
SELECT user_id, favicon_url FROM app_settings WHERE user_id = 'e9c16b1f-60e0-4e46-b816-1d76790bf58d';

-- Add a column to track if this is a public setting
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Update your existing record to be public
UPDATE app_settings 
SET is_public = TRUE 
WHERE user_id = 'e9c16b1f-60e0-4e46-b816-1d76790bf58d';
