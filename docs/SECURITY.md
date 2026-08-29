# Security

- HttpOnly, SameSite admin cookie; `__Host-` prefix in production
- HMAC-signed sessions and constant-time password comparison
- Strong password checks in production
- Security headers/CSP in `next.config.mjs`
- No service-role key in client bundles
- Server-side authorization on every mutation
- File MIME and size allowlists
- Honeypot and request throttling on inquiry/login routes
- Supabase RLS enabled; production server writes with service role

The in-memory rate limiter is best-effort per application instance. For very high traffic or distributed abuse protection, place the site behind Cloudflare/Vercel WAF or replace it with a shared Redis/Upstash limiter.
