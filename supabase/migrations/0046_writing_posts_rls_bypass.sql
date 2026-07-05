-- Align writing_posts RLS with projects: allow bypass-auth edits on the legacy portfolio owner row.

DROP POLICY IF EXISTS "Owners can manage their writing posts" ON public.writing_posts;

CREATE POLICY "Writing posts select policy" ON public.writing_posts
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

CREATE POLICY "Writing posts insert policy" ON public.writing_posts
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

CREATE POLICY "Writing posts update policy" ON public.writing_posts
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );

CREATE POLICY "Writing posts delete policy" ON public.writing_posts
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR user_id = '7cd2752f-93c5-46e6-8535-32769fb10055'::uuid
  );
