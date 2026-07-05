-- Writing posts: long-form thought leadership with block-based content
CREATE TABLE IF NOT EXISTS public.writing_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  hero_image TEXT,
  layout TEXT NOT NULL DEFAULT 'essay' CHECK (layout IN ('essay', 'magazine', 'note')),
  topics TEXT[] NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT writing_posts_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS writing_posts_user_published_idx
  ON public.writing_posts (user_id, published, sort_order DESC, published_at DESC);

COMMENT ON TABLE public.writing_posts IS
  'Block-based writing posts for /writing index and /writing/{slug} detail pages.';

ALTER TABLE public.page_visibility
  ADD COLUMN IF NOT EXISTS writing BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.seo_data DROP CONSTRAINT IF EXISTS seo_data_page_type_check;

ALTER TABLE public.seo_data ADD CONSTRAINT seo_data_page_type_check CHECK (
  page_type IN (
    'home',
    'about',
    'contact',
    'music',
    'visuals',
    'case_studies',
    'case_study_defaults',
    'writing_index',
    'writing_post_defaults',
    'sitewide'
  )
  OR page_type LIKE 'case-study:%'
  OR page_type LIKE 'writing-post:%'
);

ALTER TABLE public.writing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their writing posts"
  ON public.writing_posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_writing_posts_public()
RETURNS SETOF public.writing_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.*
  FROM public.writing_posts wp
  WHERE wp.published = true
  ORDER BY wp.sort_order DESC NULLS LAST, wp.published_at DESC NULLS LAST, wp.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_writing_post_by_slug_public(p_slug text)
RETURNS SETOF public.writing_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.*
  FROM public.writing_posts wp
  WHERE wp.published = true
    AND lower(trim(wp.slug)) = lower(trim(p_slug))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_writing_posts_public() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_writing_post_by_slug_public(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_writing_posts_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_writing_post_by_slug_public(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_writing_posts_public() IS
  'Anonymous-safe published writing posts for portfolio owner.';
COMMENT ON FUNCTION public.get_writing_post_by_slug_public(text) IS
  'Returns a single published writing post by slug.';

-- Seed sample posts when portfolio owner profile exists (safe no-op otherwise)
INSERT INTO public.writing_posts (
  user_id,
  slug,
  title,
  subtitle,
  excerpt,
  layout,
  topics,
  blocks,
  published,
  published_at,
  sort_order
)
SELECT
  p.id,
  'teams-skip-behavior-design',
  'Teams skip behavior design. Deploy is cheap.',
  'Why enterprise AI products fail after launch, and what design leaders can do about it.',
  'Enterprise teams ship AI features fast but skip the behavior design that makes them trustworthy. Here is a practical framework for closing that gap.',
  'essay',
  ARRAY['Enterprise AI', 'Product Design', 'UX Strategy'],
  '[
    {"id":"b1","type":"prose","visible":true,"content":"Enterprise AI teams can deploy assistants in weeks. What they cannot deploy overnight is **trust**: the behaviors users need when models fail, policies conflict, or workflows span multiple systems.\n\n## The gap is not model quality\n\nMost post-launch pain comes from missing product behaviors: retry paths, escalation, disclosure, and recovery. Design leaders own that layer.\n\n## Start with failure, not demo\n\nMap the top three ways your agent fails in production. Design explicit UI for each before you polish the happy path."},
    {"id":"b2","type":"pull_quote","visible":true,"text":"Deploy is cheap. Behavior design is the product.","attribution":"Brian Bureson"},
    {"id":"b3","type":"prose","visible":true,"content":"## What to ship first\n\n1. Clear scope boundaries (what the agent will not do)\n2. Visible confidence and source attribution\n3. One-click human handoff with context preserved\n\nThese three patterns show up in every regulated, high-stakes AI program I have led. They are boring on a slide and essential in production."}
  ]'::jsonb,
  true,
  NOW(),
  100
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.writing_posts wp WHERE wp.slug = 'teams-skip-behavior-design'
)
ORDER BY p.created_at ASC
LIMIT 1;

INSERT INTO public.writing_posts (
  user_id,
  slug,
  title,
  subtitle,
  excerpt,
  layout,
  topics,
  blocks,
  published,
  published_at,
  sort_order
)
SELECT
  p.id,
  'design-systems-for-agent-ux',
  'Design systems for agent UX',
  'Patterns that scale when the UI is conversational and non-deterministic.',
  'Agent experiences need design system primitives beyond buttons and forms: tool states, streaming, confirmation, and rollback.',
  'note',
  ARRAY['Design Systems', 'Enterprise AI'],
  '[
    {"id":"b1","type":"prose","visible":true,"content":"Traditional design systems assume deterministic screens. Agent UX adds **states** that components rarely model: thinking, tool-running, partial results, policy blocks, and user override.\n\nTreat these as first-class tokens and components, not one-off case study screens."}
  ]'::jsonb,
  true,
  NOW() - INTERVAL '7 days',
  90
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.writing_posts wp WHERE wp.slug = 'design-systems-for-agent-ux'
)
ORDER BY p.created_at ASC
LIMIT 1;
