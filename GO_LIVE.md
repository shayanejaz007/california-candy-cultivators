# Go live — California Candy Cultivators

Read the first section before you deploy. It decides whether the price editor
actually works.

---

## Read this first: prices will not save in demo mode

The build currently runs `DATA_DRIVER=demo`, which keeps everything in memory.
I tested this directly:

```
set pricing on gelato-41   -> saved, reads back correctly
restart the server         -> pricing reverted to "Sample tier"
```

On Vercel it is worse than a restart. Each request can land on a different
serverless instance, and instances go cold after a short idle. So you could set
a price, refresh, and see the old one back within a minute — with no error
anywhere.

**You asked for the admin to set prices on products. That requires Supabase.**
The code, schema and admin UI are all ready for it; only the database is
missing. It is about 10 minutes of setup — Step 2 below.

Deploying in demo mode is fine for showing the site to someone. It is not fine
for running the menu.

---

## Step 1 — Push the code

```bash
cd ccc-site
git init
git add -A
git commit -m "California Candy Cultivators"
git branch -M main
git remote add origin git@github.com:YOUR_USER/ccc-site.git
git push -u origin main
```

Then on vercel.com: **Add New → Project → Import** your repo. Framework is
detected as Next.js; leave the build settings alone.

Or from the CLI:

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

---

## Step 2 — Supabase (do this, or prices will not stick)

1. Create a project at supabase.com.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → Run.
3. Optionally run `supabase/seed.sql` for starter strains.
4. **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

## Step 3 — Environment variables

In Vercel: **Settings → Environment Variables**. Set for Production *and*
Preview.

```env
DATA_DRIVER=supabase
DEMO_FALLBACK=true

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # server only — never NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # safe to expose

ADMIN_PASSWORD=<long passphrase, 12+ chars>
SESSION_SECRET=<npm run secret>

NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_AGE_LIMIT=21
INQUIRY_WEBHOOK_URL=                        # optional but recommended
```

Generate the session secret locally:

```bash
npm run secret
```

`ADMIN_PASSWORD` is bound into the session signature, so changing it signs
every device out immediately. That is the correct response to a leaked login.

Leave `DEMO_FALLBACK=true` for the first deploy — if Supabase is misconfigured
the public site serves sample data instead of erroring. Once `/api/health`
reports `"database": "ready"`, set it to `false` so problems surface loudly
rather than hiding behind demo content.

---

## Step 4 — Verify

```bash
curl https://yourdomain.com/api/health
```

You want:

```json
{ "ok": true, "driver": "supabase", "database": "ready", "demo": false }
```

If `driver` still says `demo`, `DATA_DRIVER` did not apply — redeploy after
saving the variables, since Vercel bakes them at build time.

Then confirm the thing you actually care about:

1. Sign in at `/login`.
2. Open a strain, set a price, save.
3. Wait a couple of minutes, hard-refresh the public page.
4. The price is still there. If it is, you are live.

The amber **“Demo mode — changes are not saved”** banner in the admin
disappears once Supabase is connected. If you can still see it, prices are
still being thrown away.

---

## Step 5 — Domain

**Vercel → Settings → Domains → Add.** Point your registrar at Vercel's
nameservers, or add the `A` / `CNAME` records it shows you. HTTPS is automatic.

Afterwards set `NEXT_PUBLIC_SITE_URL` to the real domain and redeploy, so
canonical URLs, `robots.txt`, the sitemap and Open Graph tags stop pointing at
the temporary `.vercel.app` address.

---

## Media uploads

With Supabase connected, `schema.sql` creates a public `strain-media` bucket
and the browser uploads straight to it with a signed URL, so files never pass
through a serverless function and the 4.5 MB request-body limit does not apply.

Hero footage lives in `public/media/` and ships with the build — replace those
files and redeploy to change it. `public/media/README.md` has the `ffmpeg`
commands and target bitrates.

---

## What I changed in this pass

- **Fonts are vendored** into `app/fonts/` and loaded with `next/font/local`.
  They were fetched from `fonts.googleapis.com` during the build, which made
  every deploy depend on Google being reachable from the build machine — a
  transient blip failed the build outright. Builds are hermetic now. Run
  `npm run fonts:sync` if you ever bump the `@fontsource` packages.
- **Structured pricing editor** replacing the `label | price` textarea. Add,
  remove and reorder tiers, with one-tap presets (Gram → Pound). Prices stay
  free text so `Call`, `MKT` and `$2,800/lb` all still work.
- **Demo-mode banner** in the admin, so nobody trusts a price that is about to
  vanish.
- **Responsive admin.** It was a fixed 236px sidebar next to the content —
  about 139px of usable width on a 375px phone. Below 860px the sidebar is now
  a horizontally scrollable tab strip.
- **Mobile input zoom fixed.** Inputs under 16px make iOS Safari zoom the page
  on focus; there is now a floor.
- **Touch targets** in the media manager raised from 32px to 44px.
- **Age gate reduced-motion bug.** The curtains are suppressed for users who
  ask for reduced motion, but the dismiss timer still waited 1180ms — leaving
  them on a frozen, unscrollable page for over a second. The timer now matches.
- `100vh` → `100dvh` in the admin shell, so the mobile URL bar stops causing
  phantom scroll.
- Wide admin tables labelled for screen readers as horizontally scrollable.

`npm run check` (lint + production build) passes clean.
