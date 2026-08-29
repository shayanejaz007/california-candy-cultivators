# API

Privileged routes require the admin session.

- `POST/DELETE /api/auth`
- `GET/POST /api/strains`
- `PATCH/DELETE /api/strains/[slug]`
- `POST /api/strains/reorder`
- `POST/DELETE/PATCH /api/strains/[slug]/media`
- `POST /api/strains/[slug]/media/sign` (Supabase production)
- `POST /api/strains/[slug]/media/complete` (Supabase production)
- `GET/POST /api/inquiries`
- `PATCH /api/inquiries/[id]`

Never expose mutation routes without `requireAdmin()`.
