-- Allow anonymous users to read all published projects (including requires_password = true)
-- so the home list, slug resolution, and password gate receive correct requires_password / password.
-- Content was already intended to be gated in the app, not hidden at the RLS layer.

DROP POLICY IF EXISTS "Public non-password-protected projects are viewable by everyone" ON projects;

CREATE POLICY "Published projects are viewable by everyone"
ON projects FOR SELECT
USING (published = true);
