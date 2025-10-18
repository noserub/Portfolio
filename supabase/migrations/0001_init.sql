-- Initial database schema for Brian's Portfolio
-- Generated from React components, TypeScript types, and mock data analysis

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio_paragraph_1 TEXT,
  bio_paragraph_2 TEXT,
  super_powers_title TEXT DEFAULT 'Super powers',
  super_powers TEXT[] DEFAULT '{}',
  highlights_title TEXT DEFAULT 'Highlights',
  highlights JSONB DEFAULT '[]',
  leadership_title TEXT DEFAULT 'Leadership & Impact',
  leadership_items JSONB DEFAULT '[]',
  expertise_title TEXT DEFAULT 'Expertise',
  expertise_items JSONB DEFAULT '[]',
  how_i_use_ai_title TEXT DEFAULT 'How I Use AI',
  how_i_use_ai_items JSONB DEFAULT '[]',
  process_title TEXT DEFAULT 'Process',
  process_subheading TEXT,
  process_items JSONB DEFAULT '[]',
  certifications_title TEXT DEFAULT 'Certifications',
  certifications_items JSONB DEFAULT '[]',
  tools_title TEXT DEFAULT 'Tools',
  tools_categories JSONB DEFAULT '[]',
  section_order TEXT[] DEFAULT '{}',
  research_insights JSONB DEFAULT '[]',
  CONSTRAINT username_length CHECK (char_length(full_name) >= 3)
);

-- Create projects table (case studies/portfolio items)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT, -- Main project image URL
  position_x DECIMAL(5,2) DEFAULT 50.00,
  position_y DECIMAL(5,2) DEFAULT 50.00,
  scale DECIMAL(3,2) DEFAULT 1.00,
  published BOOLEAN DEFAULT false,
  requires_password BOOLEAN DEFAULT false,
  password TEXT,
  case_study_content TEXT,
  case_study_images JSONB DEFAULT '[]',
  flow_diagram_images JSONB DEFAULT '[]',
  video_items JSONB DEFAULT '[]',
  gallery_aspect_ratio TEXT DEFAULT '3x4' CHECK (gallery_aspect_ratio IN ('3x4', '4x3', '2x3', '3x2', '16x9')),
  flow_diagram_aspect_ratio TEXT DEFAULT '3x4' CHECK (flow_diagram_aspect_ratio IN ('3x4', '4x3', '2x3', '3x2', '16x9')),
  video_aspect_ratio TEXT DEFAULT '3x4' CHECK (video_aspect_ratio IN ('3x4', '4x3', '2x3', '3x2', '16x9', '9x16')),
  gallery_columns INTEGER DEFAULT 1 CHECK (gallery_columns IN (1, 2, 3)),
  flow_diagram_columns INTEGER DEFAULT 1 CHECK (flow_diagram_columns IN (1, 2, 3)),
  video_columns INTEGER DEFAULT 1 CHECK (video_columns IN (1, 2, 3)),
  project_images_position INTEGER,
  videos_position INTEGER,
  flow_diagrams_position INTEGER,
  solution_cards_position INTEGER,
  section_positions JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0
);

-- Create contact_messages table
CREATE TABLE contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create music_playlist table
CREATE TABLE music_playlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Create visuals_gallery table
CREATE TABLE visuals_gallery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Create seo_data table
CREATE TABLE seo_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'about', 'contact', 'music', 'visuals', 'case_studies', 'case_study_defaults', 'sitewide')),
  title TEXT,
  description TEXT,
  keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card TEXT CHECK (twitter_card IN ('summary', 'summary_large_image')),
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  canonical_url TEXT,
  site_name TEXT,
  site_url TEXT,
  default_author TEXT,
  default_og_image TEXT,
  default_twitter_card TEXT CHECK (default_twitter_card IN ('summary', 'summary_large_image')),
  favicon_type TEXT CHECK (favicon_type IN ('text', 'image')),
  favicon_text TEXT,
  favicon_gradient_start TEXT,
  favicon_gradient_end TEXT,
  favicon_image TEXT,
  UNIQUE(user_id, page_type)
);

-- Create page_visibility table
CREATE TABLE page_visibility (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  about BOOLEAN DEFAULT true,
  contact BOOLEAN DEFAULT true,
  music BOOLEAN DEFAULT true,
  visuals BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Create app_settings table
CREATE TABLE app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logo_url TEXT,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  is_authenticated BOOLEAN DEFAULT false,
  show_debug_panel BOOLEAN DEFAULT false,
  UNIQUE(user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE visuals_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Public projects are viewable by everyone" ON projects FOR SELECT USING (published = true);
CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contact_messages
CREATE POLICY "Users can view their own messages" ON contact_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own messages" ON contact_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON contact_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for music_playlist
CREATE POLICY "Public music is viewable by everyone" ON music_playlist FOR SELECT USING (true);
CREATE POLICY "Users can insert their own music" ON music_playlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own music" ON music_playlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own music" ON music_playlist FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for visuals_gallery
CREATE POLICY "Public visuals are viewable by everyone" ON visuals_gallery FOR SELECT USING (true);
CREATE POLICY "Users can insert their own visuals" ON visuals_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visuals" ON visuals_gallery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own visuals" ON visuals_gallery FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for seo_data
CREATE POLICY "Public SEO data is viewable by everyone" ON seo_data FOR SELECT USING (true);
CREATE POLICY "Users can insert their own SEO data" ON seo_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own SEO data" ON seo_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own SEO data" ON seo_data FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for page_visibility
CREATE POLICY "Public page visibility is viewable by everyone" ON page_visibility FOR SELECT USING (true);
CREATE POLICY "Users can insert their own page visibility" ON page_visibility FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own page visibility" ON page_visibility FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own page visibility" ON page_visibility FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for app_settings
CREATE POLICY "Users can view their own settings" ON app_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON app_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON app_settings FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_published ON projects(published);
CREATE INDEX idx_projects_sort_order ON projects(sort_order);
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX idx_music_playlist_user_id ON music_playlist(user_id);
CREATE INDEX idx_music_playlist_sort_order ON music_playlist(sort_order);
CREATE INDEX idx_visuals_gallery_user_id ON visuals_gallery(user_id);
CREATE INDEX idx_visuals_gallery_sort_order ON visuals_gallery(sort_order);
CREATE INDEX idx_seo_data_user_id ON seo_data(user_id);
CREATE INDEX idx_seo_data_page_type ON seo_data(page_type);

-- Create function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_music_playlist
  BEFORE UPDATE ON music_playlist
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_visuals_gallery
  BEFORE UPDATE ON visuals_gallery
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_seo_data
  BEFORE UPDATE ON seo_data
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_page_visibility
  BEFORE UPDATE ON page_visibility
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_app_settings
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert default data for the main user (you can customize this)
-- This will be populated when the first user signs up via the trigger
-- But we can also insert some default SEO data
INSERT INTO seo_data (user_id, page_type, title, description, keywords) VALUES 
  (NULL, 'sitewide', 'Brian Bureson - Product Designer', 'Portfolio of Brian Bureson, a Colorado-based product designer and strategic design leader with 20+ years of experience.', 'product design, UX, user research, portfolio'),
  (NULL, 'home', 'Brian Bureson - Product Designer', 'Portfolio of Brian Bureson, a Colorado-based product designer and strategic design leader with 20+ years of experience.', 'product design, UX, user research, portfolio'),
  (NULL, 'about', 'About Brian Bureson - Product Designer', 'Learn about Brian Bureson, a Colorado-based product designer with 20+ years of experience in enterprise, mid-size, and startup environments.', 'about, product designer, UX, experience'),
  (NULL, 'contact', 'Contact Brian Bureson - Product Designer', 'Get in touch with Brian Bureson for design opportunities, collaborations, or questions about his work.', 'contact, product designer, collaboration'),
  (NULL, 'music', 'Music by Brian Bureson', 'Listen to music created by Brian Bureson, a product designer with a passion for creative expression.', 'music, creative, product designer'),
  (NULL, 'visuals', 'Visual Work by Brian Bureson', 'Explore the visual work and creative projects by Brian Bureson, a product designer with an eye for aesthetics.', 'visuals, creative, design, portfolio');

