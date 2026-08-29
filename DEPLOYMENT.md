# Deployment

The canonical deployment guide is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Production must use `DATA_DRIVER=supabase`; the local file driver is intentionally blocked on common serverless platforms because ephemeral filesystems would lose edits.


## Runtime diagnostics

After deployment, open `/api/health`. See `docs/RUNTIME_DIAGNOSTICS.md` for status meanings.
