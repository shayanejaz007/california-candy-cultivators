# DEPLOYMENT

Follow in order. About 25 minutes.

You need: **GitHub**, **Supabase**, **Vercel**, and **Node 22** locally
(`node -v`).

---

# STEP 1 — Install

```bash
npm install
```

~320 packages, no errors expected.

---

# STEP 2 — Supabase

Create a project at supabase.com. Pick a strong database password and the
region closest to California.

Then, in **SQL Editor → New query**, run these files in order:

| # | File | What it does |
|---|---|---|
| 1 | `supabase/schema.sql` | Tables, RLS, `strain-media` bucket |
| 2 | `supabase/fix-permissions.sql` | Grants. Fixes `permission denied for table strains` |
| 3 | `supabase/migration-accounts-and-sku.sql` | `customers` table + `sku` column |
| 4 | `supabase/migration-simplify-inquiries.sql` | Only if upgrading an existing database — read step 1 inside it before uncommenting the drops |

Optional: `supabase/demo-seed.sql` for sample strains. **Remove them before
launch** with `supabase/remove-demo-rows.sql` — seeded rows are named
`DEMO …` and would appear on your live menu.

---

# STEP 3 — Keys

**Project Settings → API.** Copy three values:

| Value | Goes in |
|---|---|
| Project URL | `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable / anon key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Secret / service_role key** | `SUPABASE_SECRET_KEY` |

> The secret key is full database access with row-level security bypassed.
> Never put it in a `NEXT_PUBLIC_` variable, never commit it, never paste it
> into a chat or screenshot. If it leaks, rotate it on that same page.

---

# STEP 4 — Configure locally

Create `.env.local`:

```env
DATA_DRIVER=supabase

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

ADMIN_PASSWORD=pick-a-long-passphrase
SESSION_SECRET=paste-output-of-npm-run-secret

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AGE_LIMIT=21
```

```bash
npm run secret   # generates SESSION_SECRET
```

`ADMIN_PASSWORD` must be 12+ characters — production refuses to start
otherwise. `.env.local` is already gitignored.

---

# STEP 5 — Verify before deploying

```bash
npm run check:supabase
```

Checks environment, database role, both tables, the storage bucket, and a real
insert/delete round trip. **Do not continue until it prints `Ready.`**

| Failure | Fix |
|---|---|
| `strains table not found` | Step 2 file 1 was not run |
| `permission denied` | Step 2 file 2 was not run |
| `key rejected` / `role is not service_role` | The publishable key is in the secret slot |
| `SECRET key in a NEXT_PUBLIC_ variable` | Move it server-side, then **rotate that key** |
| `strain-media bucket missing` | Re-run `schema.sql` |

---

# STEP 6 — Test locally, end to end

```bash
npm run build && npm start
npm run test:matrix http://localhost:3000 <your-admin-password>
```

Expect **70/70 passed**.

Then walk the real flow by hand:

1. Open the site in **Incognito** — the 21+ gate should appear
2. The menu should say *"Approved accounts only"*
3. Sign up at `/signup`
4. Sign in at `/login` (admin) → **Accounts** tab → **Approve**
5. Back in Incognito, reload — the menu is now visible
6. Restart the server, reload — the menu is **still** visible

Step 6 is the one that proves persistence rather than memory.

---

# STEP 7 — Push

```bash
git add -A
git commit -m "Accounts, SKU, security hardening"
git push
```

Before pushing, confirm no secrets are staged:

```bash
git ls-files | grep -i env     # should show .env.example only
```

---

# STEP 8 — Vercel

**Add New → Project → Import** your repo. Framework auto-detects as Next.js;
change nothing in the build settings.

Add every variable from Step 4 under **Environment Variables**, for
**Production and Preview**, but set:

```env
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

Then **Deploy**.

> `NEXT_PUBLIC_*` values are compiled in at build time. Changing one later
> requires a **redeploy** — saving it is not enough.

---

# STEP 9 — Confirm

```bash
curl https://your-project.vercel.app/api/health
```

```json
{ "ok": true, "driver": "supabase", "database": "ready", "configOk": true }
```

Detailed diagnostics are deliberately admin-only; `configOk: false` means sign
in at `/login` and re-check `/api/health` to see which variables are wrong.

| Symptom | Cause |
|---|---|
| `"driver": "demo"` | Old build — demo mode no longer exists; redeploy |
| `"database": "unavailable"` | Credentials wrong, or Step 2 incomplete |
| `configOk: false` | A required variable is missing or misplaced |

Then prove the database is genuinely wired to the live site:

```bash
npm run seed:verify https://your-project.vercel.app
```

This writes a strain whose name is generated at runtime, asks your live site
for its pages, checks the name and price appear in the returned HTML, then
deletes it. A pass cannot be faked.

---

# STEP 10 — Domain

**Settings → Domains → Add.** Add the DNS records Vercel shows you. HTTPS is
automatic.

Afterwards set `NEXT_PUBLIC_SITE_URL` to the real domain and **redeploy**, or
canonical URLs, `robots.txt`, the sitemap and social cards will keep pointing
at the `.vercel.app` address.

---

# STEP 11 — Before real traffic

- [ ] `supabase/remove-demo-rows.sql` — your live menu currently says **DEMO**
- [ ] Replace `public/hero-landscape.mp4` and `hero-vertical.mp4` — the shipped
      files are ~6 KB placeholders. See `public/media/README.md` for `ffmpeg`
      commands
- [ ] Set `INQUIRY_WEBHOOK_URL`, or nobody is told when an inquiry arrives
- [ ] Approve or reject pending accounts — nothing notifies you of a signup yet
- [ ] Have counsel review `/privacy` and `/terms`. They are a working draft,
      not legal advice, and your wholesale tiers point at licensed
      distribution — confirm they match your DCC license class

---

# Rotating credentials

| Change | Effect |
|---|---|
| `ADMIN_PASSWORD` | All admin sessions invalidated immediately |
| `SESSION_SECRET` | All admin **and customer** sessions invalidated |
| Supabase secret key | Rotate in Supabase, update Vercel, redeploy |

Session invalidation on password change is deliberate — it is what makes
rotating a leaked credential actually effective.

---

# Troubleshooting

**Build fails on Vercel** — run `npm run check` locally; it runs the same lint
and build gates. Fonts are vendored in `app/fonts/`, so a font fetch is never
the cause.

**Menu is empty for an approved user** — check `/api/health`. If
`database: ready`, the catalogue itself is empty or every strain is unpublished.

**Customer cannot see the menu after approval** — approval is read per request,
so a reload is enough. If it persists, confirm their status in the Accounts tab
is `APPROVED` and not `PENDING`.

**Age gate never appears** — you already passed it; the cookie lasts a year.
Use Incognito or set `AGE_GATE_ALWAYS_SHOW=true`.

**Media upload fails** — needs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **and a
redeploy** after setting it. Uploads go browser → Supabase directly, so that key
must be in the client bundle.

**`npm audit` shows 2 vulnerabilities** — both are `postcss`, pulled in by
Next's build toolchain. Build-time only, unreachable at runtime with a single
hand-written stylesheet. **Do not run `npm audit fix --force`** — it downgrades
Next and reintroduces real runtime CVEs.

---

# Migrating to Supabase Auth later

Current authentication is hand-rolled: scrypt hashing plus an HMAC-signed
HttpOnly cookie. It was built this way so it could be tested end to end without
a live Supabase connection, and every path is covered by `test:matrix`.

It has no password reset and no email verification. When you need either:

1. `npm install @supabase/ssr`
2. Move `customers` to Supabase Auth users, keeping `status` in a profile table
3. Replace `lib/customer-auth.js` with the `@supabase/ssr` server client
4. Add middleware to refresh sessions
5. `lib/account.js` keeps working — it only needs a customer id and a status

The approval model, the admin Accounts tab and every gate stay unchanged.
