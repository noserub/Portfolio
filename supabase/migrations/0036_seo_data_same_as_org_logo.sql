-- GEO: optional structured-data fields for sameAs URLs and organization logo (sitewide row only).
ALTER TABLE public.seo_data
  ADD COLUMN IF NOT EXISTS same_as TEXT,
  ADD COLUMN IF NOT EXISTS organization_logo_url TEXT;
