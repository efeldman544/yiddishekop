-- Run this in your Supabase SQL Editor
--
-- Locks down video_candidates so employers can only read video candidates
-- that are assigned (via candidate_job_assignments) to one of their jobs.
-- Previously any logged-in user could read the whole table, which is how
-- unassigned video interviews leaked into employer portals.
--
-- Server routes using the service-role key (e.g. AI matching) bypass RLS
-- and are unaffected.

-- Drop every existing policy on the table so we start from a known state
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'video_candidates'
  loop
    execute format('drop policy %I on public.video_candidates', p.policyname);
  end loop;
end $$;

alter table public.video_candidates enable row level security;

-- Admins: full read/write (uploads, edits, deletes all happen in admin pages)
create policy "Admins have full access to video candidates"
  on public.video_candidates
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Employers: read only the video candidates assigned to one of their jobs
create policy "Employers can view assigned video candidates"
  on public.video_candidates for select
  using (
    exists (
      select 1
      from public.candidate_job_assignments a
      join public.job_requirements j on j.id = a.job_id
      where a.candidate_id = video_candidates.id
        and j.employer_id = auth.uid()
    )
  );
