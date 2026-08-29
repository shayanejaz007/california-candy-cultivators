-- ---------------------------------------------------------------------------
-- Adds the structured inquiry answers.
--
-- Inquiries were arriving with a name and a phone number and nothing else,
-- because the only place to say what you wanted was a free-text box that
-- almost nobody fills in on a phone. The form now asks two tappable questions
-- instead, and these are the columns behind them.
--
-- Both are plain text with a default, so existing rows stay valid and the app
-- keeps working if this has not been run yet.
--
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

alter table public.inquiries
  add column if not exists interest  text not null default '',
  add column if not exists timeframe text not null default '';

-- Lets the admin panel filter to serious buyers quickly.
create index if not exists inquiries_interest_idx
  on public.inquiries (interest, created_at desc);

comment on column public.inquiries.interest is
  'Quantity band chosen by the visitor: sample | personal | bulk | wholesale';
comment on column public.inquiries.timeframe is
  'Optional urgency: now | month | browsing';
