# FINAL_AUDIT.md

California Candy Cultivators — final production audit.

Every PASS below is the result of an actual HTTP request against a running
server. Items I could not execute in this environment are marked
**NOT TESTED** with the reason, not marked PASS.

**Automated result: 57/57 checks passing** (`node scripts/test-matrix.mjs`).

---

## Fixed Issues

### Critical

**1. Uploaded media was invisible in production.**
The file driver wrote uploads into `public/`. Next resolves `public/` from the
build manifest, so a file written there at runtime is served under `next dev`
and silently 404s under `next start`. Upload returned 201, the admin showed
success, and the image never appeared. Uploads now write to
`DATA_DIR/uploads/` and are served through a new `/api/media/[...path]` route
with strict filename validation. Verified: upload → 201, served back → 200
`image/png`, survives a full server restart.

**2. Upload type checking trusted the client.**
`file.type` is the browser-supplied Content-Type on a multipart part and is
entirely attacker-controlled. Any file could be posted labelled `image/jpeg`
and then served back from our own origin. Added `lib/verify-media.js`, which
checks magic bytes against the declared type. Verified rejected: HTML as
`image/jpeg`, SVG as `image/png`, PHP as `video/mp4`, PNG mislabelled as JPEG,
empty files. The signed direct-to-storage route now also rejects types outside
the bucket's allow-list before issuing a signature.

**3. A `loading.js` I added mid-audit broke every non-200 status.**
Worth recording because it is subtle. A root-level `loading.js` makes the route
stream, which commits HTTP 200 before `notFound()` or `redirect()` runs.
`/strains/<missing>` returned 200 instead of 404, and `/admin` returned 200
instead of redirecting to `/login` — an auth-visible regression. Removed.
Root-level loading is not appropriate for dynamic routes that can 404.

### Moderate

**4. Open Graph image was portrait.** `ccc-logo-original.png` is 896×1200;
social platforms centre-crop to roughly 1.91:1, so the wordmark was cut off.
Replaced with a purpose-built 1200×630 `og-card.jpg`. (The *choice* of the
opaque logo for OG was correct and was kept — transparency renders on white on
most platforms. The transparent `ccc-logo.png` is still used in the UI.)

**5. Broken media showed a broken-image icon.** `<img>`/`<video>` had no error
handling, so a missing file rendered the browser's broken-image glyph over the
gradient. Added `onError` handlers on all four media sites in `StrainCard` and
`StrainDetail` — the element hides and the brand gradient shows instead.

**6. `100vh` on three full-height screens** (`not-found`, `global-error`,
`LoginForm`) — overshoots on mobile because of the URL bar. Now `100dvh`.

**7. No horizontal-overflow guard.** Added `max-width: 100%` on `html/body` and
on `img/video/svg`.

**8. Duplicate hero assets.** `public/media/hero-*.{mp4,jpg}` were unreferenced
duplicates of `public/hero-*`. Removed.

**9. No centralised environment validation.** Added `lib/env.js` and wired it
into `/api/health`. It reports missing variables, a weak `SESSION_SECRET`, a
short `ADMIN_PASSWORD`, a malformed `NEXT_PUBLIC_SITE_URL`, `DATA_DRIVER=file`
on serverless, and two dangerous key mix-ups: a secret key in a `NEXT_PUBLIC_`
variable, and a publishable key used as the server key. Variable **names** only
— never values.

---

## Architecture Changes

- Media serving moved out of `public/` to `/api/media/[...path]` for the file
  driver. Supabase mode is unaffected — it serves from the bucket's public URL.
- `lib/env.js` is the single source of configuration truth.
- `/api/health` now reports `storage`, `adminReady`, and a `config` block.
- `lib/verify-media.js` is the single upload-validation path.

---

## Storage Verification

| Check | Result |
|---|---|
| Image upload | PASS — 201, URL returned |
| Video upload | PASS — 201, URL returned |
| Media served back | PASS — 200, correct `Content-Type`, `nosniff` |
| Cover auto-assigned on first upload | PASS |
| Set cover | PASS |
| Media delete (row + file) | PASS — 204 |
| Media survives server restart | PASS |
| Disguised file rejected | PASS — 415 |
| Oversized file rejected | PASS — 413 |
| Path traversal on media route | PASS — 404 on all four vectors incl. `%2e%2e` |

---

## Database Verification

Full CRUD against the persistent driver, then a restart:

| Operation | Result |
|---|---|
| Create strain | PASS |
| Edit strain | PASS |
| Pricing add / update | PASS |
| Pricing reorder | PASS |
| Inventory 25 → AVAILABLE | PASS |
| Inventory 3 → LOW STOCK | PASS |
| Inventory 0 → SOLD OUT | PASS |
| Publish / unpublish | PASS |
| Unpublished returns 404 publicly | PASS |
| Delete strain | PASS |
| Deleted strain returns 404 | PASS |
| Inquiry create / retrieve / status update | PASS |
| Structured inquiry answers persist | PASS |
| Honeypot silently discards bot submission | PASS |
| **Strain + price + media after restart** | **PASS** |

---

## Media Verification

Hero assets all resolve: `/hero-landscape.mp4`, `/hero-vertical.mp4`,
`/hero-landscape.jpg`, `/hero-vertical.jpg`.

**The hero `.mp4` files are ~6 KB placeholders.** They are structurally valid
(`ftypisom`) so nothing errors, but they are effectively empty. The homepage
shows the poster frame. Replace them before launch —
`public/media/README.md` has the `ffmpeg` commands.

---

## Mobile Verification

| Item | Result |
|---|---|
| Admin sidebar collapses below 860px | PASS |
| Admin tabs horizontally scrollable | PASS |
| iOS input-zoom floor (16px) | PASS |
| Touch targets ≥ 44px | PASS |
| `100dvh` on all full-height screens | PASS |
| Horizontal-overflow guard | PASS |
| Skip link present | PASS |
| Age gate `prefers-reduced-motion` timing | PASS |

**NOT TESTED — no browser in this environment:** rendering at 320/360/375/390/
414/430px and on tablets. The CSS uses `clamp()`, `minmax()` and media queries
throughout, and the overflow guard is in place, but *visual* confirmation at
each width needs a real device or DevTools.

---

## Security Verification

| Check | Result |
|---|---|
| CSP, HSTS, `frame-ancestors`, `nosniff`, Permissions-Policy | PASS |
| `no-store` + `noindex` on `/admin` and `/api` | PASS |
| Admin blocked logged out (`/admin` → 307) | PASS |
| Admin API blocked (401) | PASS |
| Wrong password rejected (401) | PASS |
| Session cookie `HttpOnly` + `SameSite` + `Secure` | PASS |
| `__Host-` cookie prefix in production | PASS |
| Password rotation invalidates live sessions | PASS (tested earlier) |
| Login rate limit + global ceiling | PASS |
| Inquiry rate limit + honeypot | PASS |
| Upload magic-byte validation | PASS |
| Path traversal in slug → 404 | PASS |
| Malformed JSON → 400, not 500 | PASS |
| No secrets in client bundle | PASS — grepped `.next/static/` |
| Health endpoint leaks no secrets | PASS |

---

## Build Results

```
npm install       319 packages, no errors
npm run lint      clean (eslint . --max-warnings=0)
npm run build     compiled successfully
server console    silent across the entire session
```

Node is pinned to `"node": "22.x"` — deterministic, no surprise major upgrade.

Direct dependencies are exactly six: `next`, `react`, `react-dom`,
`@supabase/supabase-js`, and the two `@fontsource` font packages.

---

## Vercel Results

**NOT TESTED — I have no Vercel credentials and no network egress to Vercel.**

What *is* verified: `vercel.json` is present and correct, the Node engine is
pinned, no route assumes a writable filesystem when `DATA_DRIVER=supabase`, and
the app throws a clear boot error if `DATA_DRIVER=file` is used on a serverless
host rather than silently losing data.

---

## Remaining Non-Critical Warnings

**1. `npm audit`: 2 vulnerabilities (1 high, 1 moderate).** Both in `postcss`,
a transitive dependency of Next's build toolchain. Build-time only, requiring
attacker-controlled CSS or a malicious `sourceMappingURL`; this project has one
hand-written stylesheet. **Do not run `npm audit fix --force`** — it downgrades
Next and reintroduces real runtime CVEs.

**2. `next lint` deprecation notice** from Next 15. Cosmetic; the ESLint CLI
migration lands in Next 16.

---

## Known Gaps — not fixed, stated plainly

**1. There is no gallery.** Your spec references `/gallery` and a gallery
section. Neither exists. Nothing links to a missing route, so nothing is
broken — but the feature is absent.

**2. The admin is one tabbed page, not separate routes.** Your §23 lists
`/admin/strains`, `/admin/inventory`, `/admin/drops`, `/admin/media`,
`/admin/inquiries`, `/admin/content`, `/admin/settings`. The actual admin is a
single `/admin` page with five tabs: Dashboard, Inventory, Menu, Coming soon,
Inquiries. Navigation does not point at any unfinished page. **There is no
content or settings management** — hero copy, footer links, social links and
site settings are not editable from the admin.

**3. Hero videos are 6 KB placeholders** (see Media Verification).

**4. Supabase mode is not verified end to end.** My sandbox cannot reach
`*.supabase.co` (`x-deny-reason: host_not_allowed`). Everything above was
verified against the persistent **file** driver, which exercises the same API
surface and the same validation. The Supabase driver's schema, columns and
query shapes were checked by inspection and match. Run
`npm run check:supabase` and then `npm run seed:verify <url>` to confirm the
live path — the second writes a strain whose name is generated at runtime and
asserts it appears in your live site's HTML, which cannot be faked.

---

## Exact Environment Variables Required

### Required in production

```env
ADMIN_PASSWORD=            # 12+ chars. Rotating signs out every device.
SESSION_SECRET=            # 32+ chars. Generate with: npm run secret
DATA_DRIVER=supabase       # 'file' throws at boot on serverless
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Required when DATA_DRIVER=supabase

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...          # server only. NEVER NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Legacy `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` names are
also accepted.

### Optional

```env
NEXT_PUBLIC_AGE_LIMIT=21
DEMO_FALLBACK=true         # set false once health reports database: ready
INQUIRY_WEBHOOK_URL=       # otherwise nobody is told about new inquiries
DATA_DIR=./data            # file driver only
```

### Server-only — must never carry a `NEXT_PUBLIC_` prefix

`ADMIN_PASSWORD`, `SESSION_SECRET`, `SUPABASE_SECRET_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `INQUIRY_WEBHOOK_URL`.

`/api/health` fails loudly if a secret key is found in a public variable.

---

## Final Deployment Instructions

1. **Supabase** — run `supabase/schema.sql`, then `supabase/fix-permissions.sql`,
   then `supabase/migration-inquiry-detail.sql`. Optionally `demo-seed.sql`.
2. **Verify** — `npm run check:supabase`. Do not proceed until it says `Ready.`
3. **Push** — commit and push. Confirm `git ls-files | grep env` shows only
   `.env.example`.
4. **Vercel** — import the repo, add every variable above for Production and
   Preview, deploy.
5. **Confirm** — `curl https://yourdomain.com/api/health` should report
   `"driver": "supabase"`, `"database": "ready"`, `"demo": false`,
   `"config": { "problems": [] }`.
6. **Prove persistence** — `npm run seed:verify https://yourdomain.com`.
7. **Lock down** — set `DEMO_FALLBACK=false` and redeploy.
8. **Before real traffic** — replace the hero videos, and have counsel review
   `/privacy` and `/terms`.

---

## Test Matrix

Run it yourself against any deployment:

```bash
node scripts/test-matrix.mjs https://yourdomain.com <admin-password>
```

```
HOME PAGE                    PASS      IMAGE UPLOAD              PASS
AGE GATE (cookie)            PASS      IMAGE DISPLAY             PASS
AGE GATE (no cookie)         PASS      VIDEO UPLOAD              PASS
AGE GATE ANIMATION MARKUP    PASS      DISGUISED FILE REJECTED   PASS
NAVIGATION / SKIP LINK       PASS      OVERSIZED FILE REJECTED   PASS
CURRENT MENU                 PASS      SET COVER MEDIA           PASS
STRAIN DETAIL                PASS      MEDIA DELETE              PASS
404 HANDLING                 PASS      PRICING UPDATE            PASS
PRIVACY / TERMS              PASS      PRICING REORDER           PASS
ROBOTS / SITEMAP             PASS      INVENTORY 25/3/0          PASS
FAVICON / ICON / APPLE ICON  PASS      INQUIRY VALIDATION        PASS
OG CARD                      PASS      INQUIRY STORAGE           PASS
API HEALTH                   PASS      INQUIRY RETRIEVAL         PASS
HEALTH REPORTS STORAGE       PASS      INQUIRY STATUS UPDATE     PASS
HEALTH LEAKS NO SECRETS      PASS      HONEYPOT                  PASS
ADMIN BLOCKED LOGGED OUT     PASS      MALFORMED JSON → 400      PASS
ADMIN API BLOCKED            PASS      PATH TRAVERSAL → 404      PASS
WRONG PASSWORD REJECTED      PASS      PERSISTENCE AFTER RESTART PASS
ADMIN LOGIN / LOGOUT         PASS      NPM INSTALL               PASS
SESSION HTTPONLY/SAMESITE    PASS      LINT                      PASS
CREATE / EDIT / DELETE       PASS      PRODUCTION BUILD          PASS
UNPUBLISH → 404              PASS      SERVER CONSOLE CLEAN      PASS

MOBILE 320/375/430PX         NOT TESTED — no browser available
TABLET / DESKTOP VISUAL      NOT TESTED — no browser available
BROWSER CONSOLE              NOT TESTED — no browser; server + dev-mode React
                                          warnings are both clean
NETWORK PANEL                NOT TESTED — all assets verified 200 via HTTP
VERCEL DEPLOYMENT            NOT TESTED — no credentials or network access
SUPABASE LIVE PATH           NOT TESTED — host blocked in this sandbox
GALLERY                      NOT IMPLEMENTED
ADMIN CONTENT / SETTINGS     NOT IMPLEMENTED
```

---

## Verdict

Every workflow I can execute here passes, including full CRUD, media
upload/serve/delete, and persistence across a restart. Four real bugs were
found and fixed, one of which — invisible uploaded media — would have looked
like a working feature until a customer noticed the images were missing.

**This is not yet verified production-ready**, for three reasons I cannot
resolve from here: the live Supabase path, the Vercel deployment, and visual
rendering in a real browser. Steps 2, 5 and 6 above close the first two in
about ten minutes. The third needs someone with a phone.

The gallery and the admin content/settings screens do not exist. If you were
expecting them in this release, they are the remaining build work.
