-- Align profiles UPDATE with projects bypass pattern (0011_final_rls_fix.sql).
-- Anon clients (site password bypass, no Supabase session) cannot satisfy auth.uid() = id.
-- Allow updates to the legacy fallback profile row when auth.uid() is null.

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (
    (select auth.uid()) IS NOT NULL AND (select auth.uid()) = id
    OR
    id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

COMMENT ON POLICY "Users can update own profile" ON profiles IS
  'Signed-in users update their row; anon + bypass can update the legacy portfolio owner row (matches projects RLS pattern).';
