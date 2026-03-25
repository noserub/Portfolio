-- Allow anon (site password bypass, no Supabase session) to update the published profile row
-- when it matches app_settings.user_id — not only the legacy hardcoded UUID from 0030.
-- Single-tenant portfolios: one app_settings row points at the owner profile.

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (
    (select auth.uid()) IS NOT NULL AND (select auth.uid()) = id
    OR
    id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
    OR
    id IN (SELECT user_id FROM public.app_settings WHERE user_id IS NOT NULL)
  );

COMMENT ON POLICY "Users can update own profile" ON profiles IS
  'Signed-in users update their row; anon + bypass can update legacy owner row or any profile id listed in app_settings.user_id.';
