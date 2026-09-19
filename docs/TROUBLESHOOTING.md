# Troubleshooting

## Admin sign-in unavailable
Check `ADMIN_PASSWORD` and ensure `SESSION_SECRET` is at least 32 characters.

## Supabase errors
Confirm `DATA_DRIVER=supabase`, URL values match, and the service-role key is server-only.

## Media upload fails
Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the `strain-media` bucket, file type and size.

## Edits disappear on deploy
You are using `DATA_DRIVER=file` on an ephemeral host. Switch to Supabase.

## Hero video blank
The ZIP includes poster JPGs but may not include final MP4s. Add `public/media/hero-landscape.mp4` and `hero-vertical.mp4` or update `lib/constants.js`.
