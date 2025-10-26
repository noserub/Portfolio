-- Fix page_visibility RLS policies to allow public access for fallback user
-- This ensures incognito users can access page visibility settings

-- Drop existing policies for page_visibility
DROP POLICY IF EXISTS "Public page visibility is viewable by everyone" ON page_visibility;
DROP POLICY IF EXISTS "Users can insert their own page visibility" ON page_visibility;
DROP POLICY IF EXISTS "Users can update their own page visibility" ON page_visibility;
DROP POLICY IF EXISTS "Users can delete their own page visibility" ON page_visibility;

-- Create new policies that allow public access to fallback user data
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

-- Also allow authenticated users to manage their own page visibility
CREATE POLICY "Authenticated users can manage their own page visibility" ON page_visibility
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
