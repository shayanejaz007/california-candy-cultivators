-- ---------------------------------------------------------------------------
-- Removes the seeded DEMO catalogue.
--
-- The rows currently in your database are the demo set: they are named
-- "DEMO Gelato 41", "DEMO Candy Paint" and so on, slugged demo-*, and their
-- descriptions read "DEMO DATA — not real inventory". Customers would see
-- that text on the live menu.
--
-- Run this once you have added your own strains. Deleting a strain cascades
-- to its strain_media rows.
--
-- Storage objects are NOT removed by this file: Postgres cannot reach the
-- bucket. Delete the demo folders under Storage → strain-media afterwards,
-- or leave them; they cost nothing and orphan no records.
-- ---------------------------------------------------------------------------

-- Preview first — run this on its own and check the list before deleting.
select slug, name, status from public.strains where slug like 'demo-%';

-- Then remove.
delete from public.strains  where slug like 'demo-%';
delete from public.inquiries where name like 'DEMO —%';
