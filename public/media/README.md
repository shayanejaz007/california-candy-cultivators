# Hero media

The ZIP includes lightweight 2-second MP4 fallbacks generated from the supplied poster artwork so the production build does not request missing video files.

Replace these with final optimized assets when ready:
- `hero-landscape.mp4`
- `hero-vertical.mp4`

Keep the poster JPGs for fast first paint and reduced-motion/save-data users. Per-strain media is managed through the admin panel and stored in Supabase Storage in production.
