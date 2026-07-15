-- Run this in the Supabase SQL Editor.
--
-- Fixes: insert or update on table "job_requirements" violates foreign key
-- constraint "job_requirements_employer_id_fkey"
--
-- The app treats job_requirements.employer_id as a profiles id (auth.uid())
-- everywhere, but the existing FK points at employer_profiles — a table that
-- only gets a row when a company name is set. Employers created via signup
-- have a profiles row and no employer_profiles row, so linking a job to them
-- violated the constraint. Repoint the FK at profiles.

alter table public.job_requirements
  drop constraint if exists job_requirements_employer_id_fkey;

-- Null out any employer_ids that don't correspond to a real profile so the
-- new constraint can be added cleanly
update public.job_requirements
  set employer_id = null
  where employer_id is not null
    and employer_id not in (select id from public.profiles);

alter table public.job_requirements
  add constraint job_requirements_employer_id_fkey
  foreign key (employer_id) references public.profiles(id)
  on delete set null;
