-- Writing index hero copy (eyebrow, title, lead) for /writing
ALTER TABLE public.page_visibility
  ADD COLUMN IF NOT EXISTS writing_index_content JSONB DEFAULT NULL;

COMMENT ON COLUMN public.page_visibility.writing_index_content IS
  'CMS copy for /writing index hero: { eyebrow, title, lead }.';
