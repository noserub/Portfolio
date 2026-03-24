# Supabase: hosted database vs migrations

## Error: `relation "profiles" already exists`

**What it means:** Something tried to run `CREATE TABLE profiles` (usually `supabase/migrations/0001_init.sql` or the whole migration chain) against a database that **already** has your schema.

**Do not fix this by dropping `profiles`.** Your live data lives there.

**What to do instead:**

1. **Stop** running `0001_init.sql` or pasting the entire `migrations/` folder into the SQL Editor.
2. For **new** changes, run **only the new migration file** (one file at a time), or use the Supabase CLI against a linked project (see below).

---

## Apply only the favicon / `app_settings` public read fix

This restores anonymous `SELECT` on `app_settings` so the custom favicon loads for visitors (preview, incognito, etc.).

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Click **New query**.
3. Open this file in the repo and copy **its entire contents** into the editor:

   `supabase/migrations/0025_restore_app_settings_public_select.sql`

4. Click **Run**.

You should see success (no error). Refresh your Vercel preview and the favicon should resolve after the policy is in place.

---

## Optional: CLI (`supabase db push`)

Use this when your local CLI is **linked** to the same hosted project and migration history is in sync:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`db push` applies **pending** migrations only; it does not re-run `0001` from scratch on an already-initialized remote database.

If `db push` complains about migration history, see [Supabase migration repair](https://supabase.com/docs/guides/cli/managing-environments#migration-repair) — do not blindly re-run `0001` on production.

---

## Local fresh database

If you use **local** Supabase (`supabase start`) and want a clean slate:

```bash
supabase db reset
```

That wipes the local DB and replays all migrations in order. This is for **local** only, not for your hosted project.
