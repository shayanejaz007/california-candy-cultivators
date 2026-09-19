# Deployment

## 1. Supabase
Create a project, run `supabase/schema.sql`, then optionally `supabase/seed.sql` for demo data.

## 2. Environment
Set all values documented in `ENVIRONMENT_VARIABLES.md`. Production must set `DATA_DRIVER=supabase`.

## 3. Host
Deploy the repository to Vercel or another Node-compatible host. Use Node 20+.

## 4. Verify
Run `npm run check` locally, then verify `/`, `/strains/<slug>`, `/login`, `/admin`, an inquiry submission, a pricing edit, an image upload, a video upload and cover switching.

## 5. Launch cleanup
Replace demo content, hero posters/media, legal text as needed, domain metadata and all placeholder contact/social values.


## Runtime diagnostics

After deployment, open `/api/health`. See `docs/RUNTIME_DIAGNOSTICS.md` for status meanings.
