-- Add hero_text column to profiles table
-- This allows hero text to be stored in the database and shared across all visitors

-- Check if column already exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'hero_text'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN hero_text JSONB DEFAULT '{
          "greeting": "Welcome,",
          "greetings": ["Welcome,", "I''m Brian.", "Designer.", "Researcher.", "Product Builder."],
          "greetingFont": "Inter, sans-serif",
          "lastGreetingPauseDuration": 30000,
          "subtitle": "Brian Bureson is a (super rad) product design leader",
          "description": "building high quality products and teams through",
          "word1": "planning",
          "word2": "collaboration", 
          "word3": "empathy",
          "word4": "design",
          "buttonText": "About Brian"
        }'::jsonb;
        
        -- Add comment to document the column
        COMMENT ON COLUMN profiles.hero_text IS 'Hero section text content stored as JSON, includes greeting, name, title, subtitle, and CTA text';
    END IF;
END $$;
