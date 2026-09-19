# Vercel deployment

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for Production, Preview, and Development as appropriate:

```env
DATA_DRIVER=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
SESSION_SECRET=YOUR_32_PLUS_CHARACTER_RANDOM_SECRET
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_AGE_LIMIT=21
TRUST_PROXY=1
INQUIRY_WEBHOOK_URL=
AGE_GATE_ALWAYS_SHOW=false
```

Run `supabase/schema.sql` in the Supabase SQL Editor before using the site.

The project pins Node to `22.x` so Vercel does not silently jump to a future Node major. The package also explicitly approves the reviewed `unrs-resolver@1.12.2` install script used by the lint dependency tree.
