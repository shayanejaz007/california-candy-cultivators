# Development guide

Use Node 20+. Copy `.env.example` to `.env.local`. For zero-setup development keep `DATA_DRIVER=file`; the app writes `data/store.json`, which is gitignored.

Before a pull request run `npm run lint` and `npm run build`. Do not commit secrets or generated media uploads.
