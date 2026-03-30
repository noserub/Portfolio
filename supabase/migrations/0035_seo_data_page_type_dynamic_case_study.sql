-- Relax seo_data.page_type CHECK so:
-- 1) Per-case-study SEO rows (case-study:<id>) are valid (app uses this prefix).
-- 2) Snake_case keys stay aligned with 0001_init (case_studies, case_study_defaults).

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
    'sitewide'
  )
  OR page_type LIKE 'case-study:%'
);
