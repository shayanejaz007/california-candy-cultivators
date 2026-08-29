# Database

Run `supabase/schema.sql` in the Supabase SQL editor.

## Tables
- `strains`: catalog content, status, quantity, pricing JSON, featured/sort flags
- `strain_media`: Storage path, public URL, type, alt/caption, sort and cover flag
- `inquiries`: visitor contact requests and workflow status
- `audit_logs`: administrative change history

Foreign keys cascade media records when a strain is deleted. Database triggers normalize sold-out/coming-soon quantities and enforce a single featured strain.
