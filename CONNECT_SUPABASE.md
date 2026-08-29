# Connecting Supabase

Your project URL and publishable key are wired in. One thing is still missing,
and the menu cannot save prices without it.

---

## What I still need from you: the secret key

You sent:

| | |
|---|---|
| Project URL | `https://erqlkzsykoidcoihfykc.supabase.co` ✅ |
| Publishable key | `sb_publishable_dhBU5F…` ✅ |
| **Secret key** | **missing** ❌ |

The publishable key is public by design — it ships to every browser. Your
`schema.sql` enables row-level security on `strains`, `strain_media`,
`inquiries` and `audit_logs`, and grants no policies to anonymous callers. That
is correct: without it, anyone who viewed your page source could rewrite your
menu. It also means **the publishable key cannot write**, so the admin panel
cannot save a price with it.

Writes go through the secret key, server-side only.

**Get it:** Supabase dashboard → **Project Settings → API** → copy the
`service_role` key (or `sb_secret_…` on newer projects).

> Do not paste that key into this chat, a screenshot, or a git commit. It is
> full database access with RLS bypassed. Put it straight into `.env.local` and
> into Vercel's environment variables. If it ever leaks, rotate it in the same
> dashboard.

---

## About the quickstart you pasted

That is Supabase's **Auth** quickstart — it sets up `@supabase/ssr` so each
visitor gets their own logged-in session refreshed by middleware. It is the
right guide for an app where customers sign up.

This site does not work that way. There is one admin, protected by
`ADMIN_PASSWORD` and a signed HttpOnly cookie, and the public menu needs no
login at all. So:

- **Skip `npm install @supabase/ssr`** — nothing would use it.
- **Skip `utils/supabase/server.ts`, `client.ts`, `middleware.ts`** — they are
  also TypeScript, and this project is JavaScript, so they would not compile as
  given.
- `@supabase/supabase-js` is already installed and already wired.

Adding the middleware would put a session-refresh round trip in front of every
request to serve a menu that has no sessions.

If you later want customer accounts — saved favourites, order history — that
quickstart becomes the right starting point. Not today.

---

## Setup

### 1. Apply the schema

Supabase dashboard → **SQL Editor → New query** → paste all of
`supabase/schema.sql` → **Run**.

This creates the tables, the RLS policies, and the public `strain-media`
storage bucket. Optionally run `supabase/seed.sql` for starter strains.

### 2. Local `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://erqlkzsykoidcoihfykc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dhBU5Fbo3-svN09F6GdBJg_nPtrft7Q

SUPABASE_URL=https://erqlkzsykoidcoihfykc.supabase.co
SUPABASE_SECRET_KEY=PASTE_YOUR_SECRET_KEY_HERE

DATA_DRIVER=supabase
DEMO_FALLBACK=true

ADMIN_PASSWORD=your-long-passphrase
SESSION_SECRET=run-npm-run-secret
NEXT_PUBLIC_AGE_LIMIT=21
```

`.env.local` is already in `.gitignore`. Keep it that way.

### 3. Verify before deploying

```bash
npm install
node --env-file=.env.local scripts/check-supabase.mjs
```

This checks the five things that actually go wrong, and names which one failed:

```
1. Environment   vars present, and no key in the wrong slot
2. Database      strains + strain_media reachable
3. Storage       strain-media bucket exists
4. Write test    insert + delete round-trip
```

It also refuses two dangerous mix-ups: a public key used as the secret (writes
would silently fail), and a secret key in a `NEXT_PUBLIC_` variable (it would
ship to every browser).

Run it with your keys and you should see **Ready.**

### 4. Vercel

Add the same variables under **Settings → Environment Variables**, for
Production and Preview. Redeploy afterwards — Vercel bakes `NEXT_PUBLIC_*`
values in at build time, so saving them is not enough on its own.

### 5. Confirm it took

```bash
curl https://yourdomain.com/api/health
```

```json
{ "ok": true, "driver": "supabase", "database": "ready", "demo": false }
```

Then the real test:

1. Sign in at `/login`
2. Set a price on a strain, save
3. Wait two minutes, hard-refresh the public page
4. The price is still there

The amber **“Demo mode — changes are not saved”** banner in the admin
disappears once this is working. If you can still see it, prices are still
being thrown away.

Once `/api/health` reports `"database": "ready"`, set `DEMO_FALLBACK=false` so
a database problem surfaces loudly instead of quietly serving sample strains.

---

## What I changed

- **`lib/supabase-env.js`** — resolves both key generations. Supabase issues
  `anon`/`service_role` on older projects and `sb_publishable_`/`sb_secret_` on
  newer ones; yours is the newer format, and the code only read the older
  names. Both work now, so nothing has to be renamed to match.
- **`app/admin/AdminClient.js`** — reads
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, falling back to the anon name. These
  are written as full literal `process.env.…` expressions because Next inlines
  public vars into the browser bundle at build time and cannot do that with a
  computed lookup.
- **`lib/db.supabase.js`** — uses the shared resolver.
- **`scripts/check-supabase.mjs`** — the preflight above.

`npm run check` (lint + production build) passes.

---

## What I could not verify

I cannot reach `erqlkzsykoidcoihfykc.supabase.co` from this environment — my
sandbox blocks outbound hosts that are not allowlisted:

```
x-deny-reason: host_not_allowed
```

So the wiring, schema match and env handling are verified, but the live
handshake against your project is not. That is exactly what
`scripts/check-supabase.mjs` is for — run it once and it will tell you in a few
seconds. If anything fails, send me the output and I will fix it.
