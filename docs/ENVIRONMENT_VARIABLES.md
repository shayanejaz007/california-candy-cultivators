# Environment variables

Required in production:

- `ADMIN_PASSWORD` — strong admin passphrase
- `SESSION_SECRET` — random 32+ character signing secret
- `NEXT_PUBLIC_AGE_LIMIT` — typically 21 where applicable
- `NEXT_PUBLIC_SITE_URL` — canonical HTTPS origin
- `DATA_DRIVER=supabase`
- `SUPABASE_URL` — server Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` — server-only secret
- `NEXT_PUBLIC_SUPABASE_URL` — browser-safe project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser-safe anon/publishable key for signed uploads

Optional:
- `TRUST_PROXY=1` only behind a trusted proxy
- `INQUIRY_WEBHOOK_URL`
- `DATA_DIR` for local file mode
