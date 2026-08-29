# Homepage / Age Gate Fix

This build fixes the issues reported while running `npm run dev`:

- The homepage age gate now always appears on a fresh homepage load in development, even if the `ccc_age_ok` cookie was set during an earlier test.
- Production still remembers a verified visitor by default.
- Set `AGE_GATE_ALWAYS_SHOW=true` in production only when you intentionally want the gate on every homepage load.
- Hero poster/video assets are available from root public URLs (`/hero-landscape.*`, `/hero-vertical.*`) to avoid missing nested-media paths.
- The hero has a CSS fallback if media ever fails to load, so missing media cannot blank or break the home screen.

After replacing an older copy of the project, delete the `.next` directory and restart the dev server so stale asset references are not retained.

## Vercel Server Component crash — demo-mode hotfix

- Added a pure `demo` driver with bundled sample catalogue data.
- `DATA_DRIVER` now defaults to `demo`, not Supabase.
- An accidental `DATA_DRIVER=file` on Vercel is coerced to demo instead of throwing during module import.
- Data drivers are lazy-loaded. Supabase/file modules no longer execute while the homepage module is being evaluated.
- Public reads can fall back to demo data when `DEMO_FALLBACK=true`.
- `/api/health` reports `database: "demo-data"` while this temporary mode is active.
- To switch later: run `supabase/schema.sql`, add the Supabase keys, set `DATA_DRIVER=supabase`, verify `/api/health`, then set `DEMO_FALLBACK=false` when desired.
