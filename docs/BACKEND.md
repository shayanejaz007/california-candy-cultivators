# Backend

Route handlers under `app/api` handle admin authentication, strain mutations, inquiry mutations, reordering and media operations. Every privileged route calls `requireAdmin()` before reading or changing private data.

The server-only Supabase client uses the service-role key. Never import `lib/db.supabase.js` directly into a client component.
