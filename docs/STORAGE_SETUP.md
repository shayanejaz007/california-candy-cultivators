# Storage setup

`supabase/schema.sql` creates a public bucket named `strain-media` with a 50 MB object limit and an allowlist for the supported image/video MIME types.

Uploads are authorized by a server-created signed token. The browser uses that token to upload directly to Storage, then calls the completion API to create the database media record.
