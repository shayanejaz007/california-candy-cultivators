-- ---------------------------------------------------------------------------
-- Simplifies the inquiry form back to: name, phone, optional notes.
--
-- Removes the columns behind fields the form no longer collects:
--   interest   quantity band     (added earlier, now removed)
--   timeframe  urgency           (added earlier, now removed)
--   email      contact address   (form is phone-only now)
--
-- DESTRUCTIVE: dropping a column deletes its data permanently. Run the SELECT
-- first and check what you would lose. If any real inquiry has an email you
-- still need, export it before continuing.
-- ---------------------------------------------------------------------------

-- 1. Preview. Run this alone first.
select
  count(*)                                             as total_inquiries,
  count(*) filter (where coalesce(email, '') <> '')    as with_email,
  count(*) filter (where coalesce(interest, '') <> '') as with_interest
from public.inquiries;

-- 2. Optional export before dropping. Copy the output somewhere safe.
-- select name, phone, email, interest, timeframe, created_at
--   from public.inquiries
--  where coalesce(email, '') <> ''
--  order by created_at desc;

-- 3. Drop. Uncomment and run once you are satisfied with step 1.
-- alter table public.inquiries
--   drop column if exists interest,
--   drop column if exists timeframe,
--   drop column if exists email;
--
-- drop index if exists inquiries_interest_idx;
