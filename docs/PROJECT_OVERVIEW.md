# Project overview

## Public experience
Visitors pass an age gate, browse the current menu, open dynamic strain pages, view genetics, availability, pricing and media, see upcoming drops, and submit an inquiry.

## Admin experience
`/admin` provides inventory/menu/drop/inquiry management plus strain editing, pricing tiers and image/video uploads. Daily content changes do not require source-code edits.

## Data modes
`file` is a local-development fallback. `supabase` is the production driver and stores structured data in Postgres and media in Supabase Storage.
