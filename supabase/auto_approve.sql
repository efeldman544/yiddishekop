-- ═══════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor, after signup_and_review.sql.
-- Safe to run repeatedly.
--
-- Holding every new candidate for approval turned out to be more than was
-- wanted. The thing actually worth holding back is an empty profile: a
-- candidate who created an account and never filled anything in, whose card
-- on browse would be blank. A profile with something in it goes live on its
-- own.
--
-- So 'pending' now means exactly one thing -- nothing filled in yet -- and
-- the admin's job on that list is to chase those people, not to approve
-- everybody.
--
-- Doing it in the database rather than in the save button covers every way a
-- row arrives: the candidate's own form, the admin editor, an import. It also
-- closes a gap. The RLS policy on candidate_profiles lets a candidate write
-- their own row, status column included, so a script could have set itself
-- active with a blank profile and landed a blank card on the public page.
-- Status is no longer something anyone can simply assert.
--
-- It finishes by reporting the state.
-- ═══════════════════════════════════════════════════════════════════════


-- ── What counts as filled in ───────────────────────────────────────────
--
-- A browse card is built from the job title, the roles they're seeking and
-- the industries they picked -- displayTitle() and cardIndustries() in
-- src/lib/browse.ts read exactly these three. Any one of them is enough to
-- make a card that says something. Location alone is not: "Lakewood, NJ" and
-- nothing else is not a candidate anyone can act on.
--
-- src/lib/profileFilledIn.ts holds the same rule for the admin list, so the
-- badge there and the behaviour here agree.

create or replace function public.candidate_profile_filled_in(
  p_title text, p_roles text, p_fields text[]
)
returns boolean
language sql
immutable
as $candidate_profile_filled_in$
  select nullif(trim(coalesce(p_title, '')), '') is not null
      or nullif(trim(coalesce(p_roles, '')), '') is not null
      or coalesce(array_length(p_fields, 1), 0) > 0;
$candidate_profile_filled_in$;


-- ── The rule, applied to every write ───────────────────────────────────
--
-- Two moves, and nothing else is touched:
--
--   pending + something filled in  ->  active
--   active  + nothing filled in    ->  pending
--
-- 'inactive' and 'placed' are decisions an admin made on purpose, so they are
-- left exactly as they are. Nothing here ever brings somebody back from them.

create or replace function public.candidate_profile_status()
returns trigger
language plpgsql
as $candidate_profile_status$
declare
  v_filled boolean;
begin
  v_filled := public.candidate_profile_filled_in(
    new.current_job_title, new.roles_seeking, new.fields_worked_in);

  if new.status = 'pending' and v_filled then
    new.status := 'active';
  elsif new.status = 'active' and not v_filled then
    new.status := 'pending';
  end if;

  return new;
end;
$candidate_profile_status$;

drop trigger if exists candidate_profile_status_trg on public.candidate_profiles;
create trigger candidate_profile_status_trg
  before insert or update on public.candidate_profiles
  for each row execute function public.candidate_profile_status();


-- ── Catch up the rows already sitting there ────────────────────────────
-- Anyone held back who had in fact filled their profile in goes live now.

update public.candidate_profiles
set status = 'active'
where status = 'pending'
  and public.candidate_profile_filled_in(current_job_title, roles_seeking, fields_worked_in);


-- Make the API see the change now rather than whenever it notices.
notify pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════
-- What the state is now.
-- ═══════════════════════════════════════════════════════════════════════
select 'auto-approve installed' as check,
  case when exists (
    select 1 from pg_trigger
    where tgname = 'candidate_profile_status_trg' and not tgisinternal
  ) then 'OK' else 'MISSING' end as result
union all
-- Should be zero. A filled-in profile no longer waits for anybody.
select 'filled-in profiles still waiting',
  (select count(*)::text from public.candidate_profiles
   where status = 'pending'
     and public.candidate_profile_filled_in(current_job_title, roles_seeking, fields_worked_in))
union all
-- Should be zero. A blank card cannot reach the public page.
select 'empty profiles live on browse',
  (select count(*)::text from public.candidate_profiles
   where status = 'active'
     and not public.candidate_profile_filled_in(current_job_title, roles_seeking, fields_worked_in))
union all
select 'candidates live on browse',
  (select count(*)::text from public.candidate_profiles where status = 'active')
union all
-- What is left on the pending list: people who signed up and never filled
-- anything in. These need chasing, not approving.
select 'signed up, profile still empty',
  (select count(*)::text from public.candidate_profiles where status = 'pending');
