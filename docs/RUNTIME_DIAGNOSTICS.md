# Runtime diagnostics

The public homepage is fail-soft: Supabase failures do not take down the age gate or the rest of the public website.

## Health endpoint

Open `/api/health` on the deployed domain.

Healthy example:

```json
{"ok":true,"driver":"supabase","database":"ready","strainCount":5}
```

Failure `problem` values:

- `configuration_missing` — required Supabase server environment variables are not available to the deployment.
- `schema_missing` — run `supabase/schema.sql` in the project's Supabase SQL Editor.
- `authentication_failed` — the server key is invalid or the wrong key type was supplied.
- `connection_failed` — the runtime could not reach Supabase.
- `database_unavailable` — inspect Vercel Function Logs for the sanitized server-side error.

Never expose the service-role/secret key in client code or screenshots.
