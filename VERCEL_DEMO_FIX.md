# Temporary Vercel Demo Mode

This build is intentionally able to run with **zero Supabase configuration**.

## Deploy now

Set:

```env
DATA_DRIVER=demo
DEMO_FALLBACK=true
NEXT_PUBLIC_AGE_LIMIT=21
AGE_GATE_ALWAYS_SHOW=false
```

`ADMIN_PASSWORD` and `SESSION_SECRET` are needed only when you want to use the admin login. The public site does not require them.

Do not set `DATA_DRIVER=file` on Vercel. This build will safely coerce it to demo if it is accidentally left there, but `demo` is clearer.

## Expected health response

Visit `/api/health` after deployment. In temporary mode the response should contain:

```json
{
  "ok": true,
  "driver": "demo",
  "database": "demo-data",
  "demo": true
}
```

## Connect Supabase later

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Add the server and public Supabase environment variables in Vercel.
3. Set `DATA_DRIVER=supabase`.
4. Keep `DEMO_FALLBACK=true` for the first verification deploy.
5. Confirm `/api/health` reports `database: "ready"` and `demo: false`.
6. After verification, optionally set `DEMO_FALLBACK=false` to remove the runtime fallback.

The demo catalogue lives in `lib/demo-data.js` and can be removed after the live database is verified.
