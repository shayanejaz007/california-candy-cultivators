# Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Optionally run `supabase/seed.sql`.
4. Copy Project URL to both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the service-role secret to `SUPABASE_SERVICE_ROLE_KEY` only.
6. Copy the anon/publishable key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Set `DATA_DRIVER=supabase`.
8. Restart/redeploy.

The schema creates the public `strain-media` Storage bucket and its read policy.
