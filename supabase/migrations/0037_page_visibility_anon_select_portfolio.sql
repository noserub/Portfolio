-- Anonymous clients must read page_visibility for the portfolio owner UUID from
-- VITE_PUBLIC_PORTFOLIO_OWNER_ID. Legacy policy only allowed the old default UUID.
DROP POLICY IF EXISTS "Allow public read access to fallback user page visibility" ON public.page_visibility;

-- Let anon read any row; the app filters by owner id. (Authenticated users still
-- use "Authenticated users can manage their own page visibility" for writes.)
CREATE POLICY "Anon can read page_visibility for public portfolio"
  ON public.page_visibility
  FOR SELECT
  TO anon
  USING (true);
