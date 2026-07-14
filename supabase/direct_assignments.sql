-- Run this in the Supabase SQL Editor (after enable_rls.sql).
--
-- Makes direct candidate→employer assignments (made by admins on the
-- candidate page, stored in employer_candidate_assignments) visible in the
-- employer portal, which previously only read job-based assignments
-- (candidate_job_assignments → job_requirements.employer_id).

-- 1. Columns the employer review flow needs (action already exists; these
--    make the table carry the same review state as candidate_job_assignments)
alter table public.employer_candidate_assignments
  add column if not exists action text;
alter table public.employer_candidate_assignments
  add column if not exists proposed_times jsonb;
alter table public.employer_candidate_assignments
  add column if not exists created_at timestamptz not null default now();

-- 2. Employers may update their own rows (request meeting / pass), same as
--    they can on job-based assignments
drop policy if exists "employer updates own" on public.employer_candidate_assignments;
create policy "employer updates own"
  on public.employer_candidate_assignments for update
  to authenticated
  using (employer_id = auth.uid())
  with check (employer_id = auth.uid());

-- 3. Visibility: employer_sees_candidate() now also counts direct assignments,
--    so candidate_profiles / videos / video_candidates RLS lets the employer
--    read candidates assigned to them directly (not only via a job)
create or replace function public.employer_sees_candidate(cand uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select
    exists (
      select 1
      from public.candidate_job_assignments a
      join public.job_requirements j on j.id = a.job_id
      where a.candidate_id = cand
        and j.employer_id = auth.uid()
    )
    or exists (
      select 1
      from public.employer_candidate_assignments e
      where e.candidate_id = cand
        and e.employer_id = auth.uid()
    );
$$;
