# California Candy Cultivators

Production-ready Next.js catalog and inquiry platform for California Candy Cultivators. The public experience preserves the supplied dark editorial design while the admin panel manages strains, availability, pricing, drops, inquiries, and per-strain photos/videos.

## Core features

- Live strain menu with availability and quantity
- Dynamic strain detail pages
- Configurable pricing tiers
- Per-strain image/video media library and cover selection
- Coming-soon drops
- Inquiry capture with admin status workflow and optional webhook
- Password-protected admin dashboard
- Age gate, privacy/terms pages, sitemap, robots and metadata
- Supabase Postgres + Storage production driver
- Local JSON/file driver for development only
- Signed direct-to-Supabase media upload in production
- Security headers, rate limiting, input checks and secure session cookies

## Quick start

```bash
cp .env.example .env.local
npm install
npm run secret
# put the generated value in SESSION_SECRET
npm run dev
```

The default local driver is `DATA_DRIVER=file`. For production, provision Supabase, run `supabase/schema.sql` then `supabase/seed.sql`, add the Supabase keys, and set `DATA_DRIVER=supabase`.

## Production environment

At minimum set:

```text
ADMIN_PASSWORD=
SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=https://your-domain.com
DATA_DRIVER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run check
```

## Documentation

Start with [docs/README.md](docs/README.md), [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md), and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).


## Runtime diagnostics

After deployment, open `/api/health`. See `docs/RUNTIME_DIAGNOSTICS.md` for status meanings.
