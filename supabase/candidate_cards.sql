-- ═══════════════════════════════════════════════════════════════════════
-- Run this whole thing in the Supabase SQL Editor. Safe to run repeatedly.
--
-- Matching used to rank candidates on a handful of profile fields and only
-- opened a resume when somebody clicked Analyze, one candidate at a time.
-- It now reads each resume once, when it changes, and keeps what it found:
--
--   candidate_cards       one row per candidate. A structured summary of the
--                         resume, the interview transcript and the profile,
--                         plus the full resume text, so nothing is downloaded
--                         or parsed again at match time.
--
--   candidate_ai_scores   gains two columns recording which version of the job
--                         and which version of the card a score was made from.
--                         That is what lets a job be re-scored only when it
--                         changed, and a candidate only when their card did.
--
-- Until this is run the app keeps working the way it did before: candidates
-- are scored on profile fields, and a cached score is used for as long as it
-- exists.
--
-- It finishes by reporting the state.
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. The cards ───────────────────────────────────────────────────────

create table if not exists public.candidate_cards (
  candidate_id  uuid not null,
  source        text not null check (source in ('profile', 'video')),
  card          jsonb not null,
  card_text     text not null,
  card_hash     text not null,
  resume_text   text,
  resume_status text not null default 'none'
    check (resume_status in ('text', 'image', 'none', 'unreadable')),
  resume_note   text,
  source_hash   text not null,
  model         text,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  built_at      timestamptz not null default now(),
  primary key (candidate_id, source)
);

alter table public.candidate_cards add column if not exists resume_note text;

create index if not exists candidate_cards_status_idx
  on public.candidate_cards (resume_status);

-- A card holds the full text of a resume, contact details and all. Nobody
-- but an admin may read it. Without a policy for them, employers and
-- candidates get nothing at all, which is the point. The server writes with
-- the service role, which is not subject to these policies.
alter table public.candidate_cards enable row level security;

drop policy if exists "Admins read candidate cards" on public.candidate_cards;
create policy "Admins read candidate cards"
  on public.candidate_cards for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ── 2. What a score was made from ──────────────────────────────────────

alter table public.candidate_ai_scores add column if not exists job_hash  text;
alter table public.candidate_ai_scores add column if not exists card_hash text;


-- ── 3. Make the API see it now ─────────────────────────────────────────
-- Without this the table can exist while the API still reports it missing,
-- which is indistinguishable from never having created it.
notify pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════
-- What the state is now.
-- ═══════════════════════════════════════════════════════════════════════
select 'cards table' as check,
  case when to_regclass('public.candidate_cards') is not null then 'OK' else 'MISSING' end as result
union all
select 'only admins can read cards',
  case when exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'candidate_cards'
      and policyname = 'Admins read candidate cards'
  ) and (select relrowsecurity from pg_class where oid = 'public.candidate_cards'::regclass)
  then 'OK' else 'NOT LOCKED DOWN' end
union all
select 'scores record what they were made from',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'candidate_ai_scores'
      and column_name in ('job_hash', 'card_hash')
  ) = 2 then 'OK' else 'MISSING COLUMNS' end
union all
select 'cards built so far',
  (select count(*)::text from public.candidate_cards);
