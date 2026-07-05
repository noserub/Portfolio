-- Remove migration seed samples and scope public writing RPCs to portfolio owner.

DELETE FROM public.writing_posts
WHERE slug IN ('teams-skip-behavior-design', 'design-systems-for-agent-ux');

DROP FUNCTION IF EXISTS public.get_writing_posts_public();
DROP FUNCTION IF EXISTS public.get_writing_post_by_slug_public(text);

CREATE OR REPLACE FUNCTION public.get_writing_posts_public(p_owner_id uuid DEFAULT '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid)
RETURNS SETOF public.writing_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.*
  FROM public.writing_posts wp
  WHERE wp.published = true
    AND wp.user_id = p_owner_id
  ORDER BY wp.sort_order DESC NULLS LAST, wp.published_at DESC NULLS LAST, wp.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_writing_post_by_slug_public(
  p_slug text,
  p_owner_id uuid DEFAULT '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
)
RETURNS SETOF public.writing_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wp.*
  FROM public.writing_posts wp
  WHERE wp.published = true
    AND wp.user_id = p_owner_id
    AND lower(trim(wp.slug)) = lower(trim(p_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_writing_posts_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_writing_post_by_slug_public(text, uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_writing_posts_public(uuid) IS
  'Published writing posts for a single portfolio owner (pass VITE_PUBLIC_PORTFOLIO_OWNER_ID from the app).';
COMMENT ON FUNCTION public.get_writing_post_by_slug_public(text, uuid) IS
  'Single published writing post by slug for a single portfolio owner.';
