# DEPLOY — California Candy Cultivators

Follow these in order. Nothing is optional except where marked.

Total time: about 25 minutes.

---

## Before you start

You need three accounts, all free to start:

- **GitHub** — holds the code
- **Supabase** — the database (without this, prices do not save)
- **Vercel** — runs the site

And one thing on your machine: **Node 22**. Check with `node -v`.

---

# STEP 1 — Get the code onto your machine

Unzip `ccc-verified.zip`. Open a terminal in the `demo` folder it creates
(rename it to `ccc-site` if you like).

```bash
npm install
```

Expect ~320 packages and no errors.

---

# STEP 2 — Create the Supabase database

**This is the step that makes prices save. Do not skip it.**

1. Go to supabase.com → **New project**.
2. Name it `ccc`, pick a strong database password, choose the region closest to
   California (`West US` / `us-west-1`).
3. Wait for it to finish provisioning (~2 minutes).

### Apply the schema

1. Left sidebar → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from the project folder, copy **all** of it.
3. Paste into the editor → **Run**.

You should see `Success. No rows returned.` That created your tables, the
security policies, and the `strain-media` storage bucket.

### Simplify the inquiries table

Run `supabase/migration-simplify-inquiries.sql`. The inquiry form collects
name, phone and optional notes only, so this drops the `interest`, `timeframe`
and `email` columns. It previews what you would lose before deleting anything —
read step 1 before uncommenting step 3.

### Apply the inquiry columns

If you set the database up before this change, run
`supabase/migration-inquiry-detail.sql` too. It adds the `interest` and
`timeframe` columns behind the two new questions on the inquiry form. Fresh
projects get them from `schema.sql` automatically.

### Apply the grants

Run `supabase/fix-permissions.sql` the same way.

`schema.sql` relies on Supabase's default privileges to give the API roles table
access. On newer projects those defaults are not always applied to tables
created by a migration, which produces `permission denied for table strains`
even though the rows are plainly visible in the Table Editor. This file makes
the grants explicit and is safe to run repeatedly.

### Load demo data (recommended for the first deploy)

Two ways — either is fine.

**A. From the SQL Editor** — same as above, but paste `supabase/demo-seed.sql`.

**B. From your terminal** (after Step 4):

```bash
npm run seed
```

Either loads 5 demo strains and 2 demo inquiries. Every row is named `DEMO …`
and slugged `demo-*`, so it is impossible to confuse with real inventory, and
one command removes all of it later.

The set deliberately covers every state the menu can display:

| Strain | State | Pricing |
|---|---|---|
| DEMO Gelato 41 | AVAILABLE, featured | 4 tiers incl. wholesale |
| DEMO Candy Paint | AVAILABLE | 2 tiers |
| DEMO Sherbhead | LOW STOCK | 2 tiers |
| DEMO Peach Ringz | SOLD OUT | none |
| DEMO Sunset Rntz | COMING SOON | none |

If all five render correctly with their badges and prices, the whole menu
pipeline works.

When you are finished:

```bash
npm run seed:clean
```

---

# STEP 3 — Collect your keys

Supabase → **Project Settings** (gear icon) → **API**.

Copy three values:

| What | Looks like | Where it goes |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | public |
| Publishable / anon key | `sb_publishable_…` or `eyJ…` | public |
| **Secret / service_role key** | `sb_secret_…` or `eyJ…` | **server only** |

> **The secret key is full database access.** Never put it in a `NEXT_PUBLIC_`
> variable, never commit it, never paste it into a chat or screenshot. If it
> leaks, rotate it on this same page immediately.

---

# STEP 4 — Configure locally

Create a file named `.env.local` in the project root:

```env
DATA_DRIVER=supabase
DEMO_FALLBACK=true

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

ADMIN_PASSWORD=pick-a-long-passphrase-here
SESSION_SECRET=paste-output-of-npm-run-secret

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AGE_LIMIT=21
```

Generate the session secret:

```bash
npm run secret
```

Paste that output as `SESSION_SECRET`.

**`ADMIN_PASSWORD` must be 12+ characters.** Production refuses to start on
anything shorter or on obvious values like `password`. Changing it later signs
out every device immediately — that is the correct response to a leaked login.

`.env.local` is already in `.gitignore`. Leave it that way.

---

# STEP 5 — Verify Supabase before you deploy

```bash
npm run check:supabase
```

This is the single most useful command in the project. It checks five things
and names exactly which one failed:

```
1. Environment   vars present, no key in the wrong slot
2. Database      strains + strain_media reachable
3. Storage       strain-media bucket exists
4. Write test    real insert + delete round-trip
```

**Do not continue until it prints `Ready.`**

Common failures:

| Message | Fix |
|---|---|
| `strains table not found` | Step 2 did not run — re-run `schema.sql` |
| `key rejected` | You copied the publishable key into the secret slot |
| `secret key looks like a PUBLIC key` | Same — grab the `service_role` key |
| `SECRET key in a NEXT_PUBLIC_ variable` | Move it. Then rotate that key. |
| `strain-media bucket missing` | Re-run `schema.sql`; it creates the bucket |

---

# STEP 6 — Run it locally

```bash
npm run dev
```

Open http://localhost:3000 and check, in this order:

1. Age gate appears → click **I am over 21** → the curtains peel open
2. The menu loads with your strains
3. Go to `/login`, sign in with your `ADMIN_PASSWORD`
4. **The amber "Demo mode" banner should NOT be there.** If it is, `DATA_DRIVER`
   is not `supabase` — go back to Step 4
5. Open a strain → set a price → **Save**
6. Stop the server (`Ctrl+C`), start it again, reload
7. **The price is still there.** That is the whole point. If it vanished,
   Step 5 did not really pass

---

# STEP 7 — Push to GitHub

```bash
git init
git add -A
git commit -m "California Candy Cultivators"
git branch -M main
git remote add origin https://github.com/YOUR_USER/ccc-site.git
git push -u origin main
```

Before pushing, confirm your secrets are not in the commit:

```bash
git ls-files | grep env
```

You should see `.env.example` and nothing else. If `.env.local` appears, stop
and fix `.gitignore` first.

---

# STEP 8 — Deploy on Vercel

1. vercel.com → **Add New → Project → Import Git Repository**
2. Pick your repo. Framework auto-detects as **Next.js** — change nothing
3. Before clicking Deploy, expand **Environment Variables** and add all of
   these (Production **and** Preview):

```env
DATA_DRIVER=supabase
DEMO_FALLBACK=true

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

ADMIN_PASSWORD=your-long-passphrase
SESSION_SECRET=your-generated-secret

NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
NEXT_PUBLIC_AGE_LIMIT=21
```

4. **Deploy**

> `NEXT_PUBLIC_*` values are baked in at build time. If you add or change one
> later, you must **redeploy** — saving it is not enough.

---

# STEP 9 — Confirm it is actually live

```bash
curl https://your-project.vercel.app/api/health
```

You want exactly this:

```json
{ "ok": true, "driver": "supabase", "database": "ready", "demo": false }
```

| If you see | It means |
|---|---|
| `"driver": "demo"` | `DATA_DRIVER` did not apply — redeploy |
| `"driver": "supabase->demo"` | Credentials wrong — check the secret key |
| `"database": "ready"`, `"demo": false` | Correct. You are live. |

Then repeat the Step 6 price test on the live URL. Set a price, wait two
minutes (long enough for the serverless instance to go cold), hard-refresh.
Still there? Done.

### Prove it properly

`/api/health` reports what the server *believes*. This proves it:

```bash
npm run seed:verify https://your-project.vercel.app
```

It writes a strain with a name and price that did not exist a second ago, asks
your live site for its pages, checks both appear in the returned HTML, then
deletes the row. There is no way to fake a pass — the name is generated at
runtime.

```
PASS  wrote probe strain "DEMO PROBE M4X2K1" with price $437
PASS  /api/health reports driver=supabase, database=ready, demo=false
PASS  homepage menu shows the probe strain
PASS  strain detail page renders
PASS  admin-set price $437 is live on the page
PASS  probe row deleted
```

If the homepage line fails, your site is not reading this database — check
`DATA_DRIVER` and redeploy.

---

# STEP 10 — Your domain

1. Vercel → **Settings → Domains → Add** → enter your domain
2. At your registrar, add the DNS records Vercel shows you
3. Wait for the certificate (usually minutes)
4. Update `NEXT_PUBLIC_SITE_URL` to the real domain
5. **Redeploy** — otherwise your canonical URLs, `robots.txt`, sitemap and
   social preview cards all still point at the `.vercel.app` address

---

# STEP 11 — Lock it down

Once you have confirmed `/api/health` says `"database": "ready"`:

```env
DEMO_FALLBACK=false
```

Redeploy. From now on a database problem shows an error instead of quietly
serving sample strains — which is what you want, because silent fallback means
customers browse a fake menu without anyone noticing.

**Optional but strongly recommended:** set `INQUIRY_WEBHOOK_URL` to a Zapier,
Make or Slack incoming webhook. Without it, inquiries land in the database and
nobody is told. Every lead depends on someone remembering to check the admin
panel.

---

# AFTER LAUNCH — things you still need to do

These are not code problems. They are content and legal, and only you can do
them.

### 1. Replace the hero footage

`public/media/hero-landscape.mp4` and `hero-vertical.mp4` are **6 KB
placeholders**. They are valid video files, but they are effectively empty.
Your homepage's main visual is a poster frame until you replace them.

`public/media/README.md` has the exact `ffmpeg` commands and target sizes.
Replace the files, commit, redeploy.

### 2. Have a lawyer read `/privacy` and `/terms`

I wrote both as a working draft for this business. They are not legal advice.
Your wholesale tiers and pound quantities point at licensed distribution —
confirm the inquiry flow and those two pages match your DCC license class
before you take real traffic.

### 3. Compress the brand PNGs (minor)

`ccc-logo.png` is 473 KB and `ccc-mark.png` is 359 KB. Next optimises them
automatically when rendered through `next/image`, so visitors are fine. But
`ccc-logo-original.png` (451 KB) is used as the social preview image, and
social crawlers fetch it raw. Running it through TinyPNG would cut it by
roughly 70%.

---

# TROUBLESHOOTING

**Build fails on Vercel**
Check the build log. If it mentions fonts, it should not — fonts are vendored
in `app/fonts/` and need no network. Any other failure: run `npm run check`
locally, it reproduces the same lint and build gates.

**`permission denied for table strains`**
The tables exist and you can see rows in the Table Editor, but the API role has
no GRANT on them. RLS is not the cause — RLS failures return zero rows or say
"violates row-level security policy".

Fix: run `supabase/fix-permissions.sql` in the SQL Editor, then re-run
`npm run check:supabase`. It grants the API roles explicit table privileges and
installs a `whoami()` helper so the preflight can report which database role
your key actually maps to.

If the preflight then says your key maps to something other than `service_role`,
the value in `SUPABASE_SECRET_KEY` is not a secret key — get the `service_role`
/ `sb_secret_` key from **Project Settings → API**.

**Amber "Demo mode" banner in admin**
`DATA_DRIVER` is not `supabase`, or the secret key is wrong. Run
`npm run check:supabase`.

**Prices save then disappear**
Same cause as above. Demo mode is memory-only, and on Vercel each request can
hit a different instance.

**Cannot sign in**
`ADMIN_PASSWORD` under 12 characters, or `SESSION_SECRET` under 32. Check the
Vercel function logs — the real reason is logged there, while the browser only
sees a generic message on purpose.

**Media upload fails**
Needs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set, and a redeploy after setting
it. Uploads go browser → Supabase directly, so the key must be in the client
bundle.

**`npm audit` shows 2 vulnerabilities**
Expected. Both are in `postcss` via Next's build toolchain, build-time only and
unreachable at runtime with a single hand-written stylesheet. **Do not run
`npm audit fix --force`** — it downgrades Next and reintroduces real CVEs.

---

# AUDIT SUMMARY — what was checked

Full clean-room run: dependencies deleted, reinstalled, rebuilt, every route
and failure path exercised.

```
npm install / lint / build        clean, 21 routes, zero warnings
server console, full session      silent
dev-mode React warnings           none (no hydration or key warnings)
all routes                        correct status codes
all referenced assets             resolve, no 404s
secrets in client bundle          none
debug code left behind            none
```

Security posture verified in this build:

```
CSP, HSTS, frame-ancestors, nosniff, Permissions-Policy   present
no-store on /admin and /api                               present
session cookie __Host- prefixed, HttpOnly, Secure         yes
password rotation invalidates live sessions               yes
constant-time password compare                            yes
login rate limit, per-client + global ceiling             yes
inquiry rate limit + honeypot                             yes
media upload path validated against strain slug           yes
RLS enabled on all four tables                            yes
```

Failure paths behave correctly:

```
Supabase misconfigured   site stays up, health reports it, log names the vars
no admin credentials     public site fine, auth returns generic 503
malformed JSON           400, not 500
path traversal in slug   404
oversized field          truncated by the sanitiser
```

The only thing that was blocking a real launch was the Supabase secret key.
Steps 2–5 above resolve it.
