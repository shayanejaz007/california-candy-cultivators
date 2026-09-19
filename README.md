# California Candy Cultivators

Private strain-menu platform. The public site is marketing; the current menu —
strains, availability, pricing — is visible only to accounts an admin has
approved.

Next.js 15 · React 19 · Supabase (Postgres + Storage) · Node 22

---

## How access works

```
visitor  →  /signup  →  PENDING  →  admin approves  →  menu visible
```

| Who | Can see |
|---|---|
| Anonymous | Hero, cultivation story, coming-soon teasers, contact, legal |
| Signed in — PENDING | The above, plus an "awaiting approval" panel where the menu goes |
| Signed in — APPROVED | Full menu, strain detail pages, pricing, availability |
| REJECTED / SUSPENDED | Blocked at sign-in with a clear message |

Approval is re-read from the database on **every request**, so suspending an
account takes effect on their next page load rather than when their cookie
expires.

Two separate sessions exist and cannot be confused for one another: the admin
panel uses a single shared password (`ADMIN_PASSWORD`), while customers have
individual accounts with scrypt-hashed passwords.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill it in — see below
npm run secret                 # paste output into SESSION_SECRET
npm run dev                    # http://localhost:3000
```

For local work without Supabase, set `DATA_DRIVER=file`. Data is written to
`./data` and uploads to `./data/uploads`. **Never use this in production** —
the app refuses to start with `DATA_DRIVER=file` on a serverless host, because
the filesystem there is ephemeral and every edit would be lost on redeploy.

---

## Environment variables

### Required

```env
ADMIN_PASSWORD=                # 12+ chars. Production refuses to boot on weak values.
SESSION_SECRET=                # 32+ chars. Signs BOTH admin and customer sessions.
DATA_DRIVER=supabase           # 'supabase' (default) or 'file' (local only)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Changing `SESSION_SECRET` or `ADMIN_PASSWORD` signs out every admin **and every
customer**. That is intentional: it is the correct response to a suspected
credential leak.

### Required when `DATA_DRIVER=supabase`

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...              # server only — never NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Legacy `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` names
are also accepted.

### Optional

```env
NEXT_PUBLIC_AGE_LIMIT=21
AGE_GATE_ALWAYS_SHOW=          # 'true' forces the gate on every visit
INQUIRY_WEBHOOK_URL=           # POSTs each new inquiry as JSON
DATA_DIR=./data                # file driver only
TRUST_PROXY=                   # '1' behind a proxy you control
```

### Never prefix these with `NEXT_PUBLIC_`

`ADMIN_PASSWORD`, `SESSION_SECRET`, `SUPABASE_SECRET_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `INQUIRY_WEBHOOK_URL`.

Anything with that prefix is compiled into the JavaScript every visitor
downloads. `/api/health` fails loudly if it finds a secret key in a public
variable.

---

## Commands

```bash
npm run dev             # development server
npm run build           # production build
npm run start           # serve the production build
npm run lint            # eslint, --max-warnings=0
npm run check           # lint + build (what CI should run)
npm run secret          # generate a SESSION_SECRET
npm run check:supabase  # verify database connection, schema, bucket, write access
npm run seed            # load DEMO rows into Supabase (dev tool)
npm run seed:clean      # remove them
npm run test:matrix     # 70-check end-to-end suite against a running server
```

---

## Project layout

```
app/
├── page.js                    home — menu gated by approval
├── signup/ signin/ account/   customer account screens
├── strains/[slug]/            strain detail — approved accounts only
├── admin/                     admin panel (tabbed, single route)
├── privacy/ terms/            legal
└── api/
    ├── account/               signup, signin, session
    ├── customers/             admin: list, approve/reject/suspend
    ├── strains/               admin: CRUD, media, pricing
    ├── inquiries/             public POST, admin GET/PATCH
    ├── media/[...path]/       serves local uploads (file driver)
    └── health/                diagnostics
lib/
├── db.js                      driver router (supabase | file)
├── db.supabase.js             production data layer
├── db.file.js                 local data layer
├── auth.js                    admin session
├── customer-auth.js           customer session
├── password.js                scrypt hashing (no Next import — unit-testable)
├── account.js                 current customer + teaser projection
├── env.js                     centralised config validation
├── rate-limit.js              per-client + global ceilings
└── verify-media.js            upload magic-byte validation
supabase/
├── schema.sql                 full schema for a fresh project
├── fix-permissions.sql        grants (fixes "permission denied for table")
├── migration-*.sql            incremental migrations
└── remove-demo-rows.sql       delete seeded DEMO catalogue
scripts/
├── check-supabase.mjs         connection preflight
├── seed-supabase.mjs          demo data + live end-to-end proof
└── test-matrix.mjs            70-check suite
```

---

## Security posture

Verified by running the app, not by inspection:

- **Sessions** — `__Host-` prefixed, `HttpOnly`, `Secure`, `SameSite=Lax`,
  HMAC-signed. The admin cookie additionally binds a fingerprint of the current
  password, so rotating it invalidates live sessions immediately.
- **Passwords** — scrypt (N=16384), unique salt per account, constant-time
  comparison. Hashes are never selected into any API response.
- **Account enumeration** — signing up with an already-registered email returns
  the *same* response as a new one; sign-in returns one message for both a
  wrong password and an unknown address, after the same delay.
- **Privilege separation** — a customer session on any admin endpoint returns
  401. A `status` supplied at signup is ignored; new accounts are always PENDING.
- **Uploads** — magic-byte validation, not the client-declared MIME type. HTML,
  SVG and PHP disguised as images are rejected.
- **Caching** — every account-varying page sends `private, no-store`, so a CDN
  cannot serve an approved user's menu to an anonymous visitor.
- **Headers** — CSP, HSTS, `frame-ancestors 'none'`, `nosniff`,
  Permissions-Policy. `no-store` and `noindex` on `/admin` and `/api`.
- **Rate limits** — login, signup and inquiries, each with a per-client limit
  and a global ceiling so forging `X-Forwarded-For` buys buckets but not budget.
- **Disclosure** — the menu is never rendered for unapproved visitors, so there
  is no hidden markup in the page source. Strain URLs are excluded from the
  sitemap and disallowed in `robots.txt`. Detailed `/api/health` diagnostics
  require an admin session.
- **Database** — RLS enabled on every table. The `customers` table explicitly
  revokes `anon` and `authenticated`, so the browser key cannot reach password
  hashes.

Known accepted risk: **no password reset and no email verification.**
Authentication is hand-rolled (scrypt + signed cookie) rather than Supabase
Auth. When you need either feature, migrate to Supabase Auth — see
`DEPLOYMENT.md`.

---

## Testing

```bash
npm run test:matrix http://localhost:3000 <admin-password>
```

70 checks over real HTTP: public pages, the account gate, admin auth, strain
CRUD, pricing, inventory transitions, media upload/serve/delete, inquiries, and
failure paths. Nothing is asserted from reading source.

---

## Deployment

See **`DEPLOYMENT.md`**.
