-- Add hero_text column to profiles table
-- This allows hero text to be stored in the database and shared across all visitors

ALTER TABLE profiles 
ADD COLUMN hero_text JSONB DEFAULT '{
  "greeting": "Hello, I'\''m Brian",
  "greetings": ["Hello, I'\''m Brian", "Hi, I'\''m Brian", "Hey, I'\''m Brian"],
  "name": "Brian Bureson",
  "title": "Product Designer & Developer",
  "subtitle": "Creating digital experiences that matter",
  "cta": "View My Work"
}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN profiles.hero_text IS 'Hero section text content stored as JSON, includes greeting, name, title, subtitle, and CTA text';

-- Update the updated_at timestamp when hero_text changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for hero_text updates
CREATE TRIGGER update_profiles_hero_text_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    WHEN (OLD.hero_text IS DISTINCT FROM NEW.hero_text)
    EXECUTE FUNCTION update_updated_at_column();
