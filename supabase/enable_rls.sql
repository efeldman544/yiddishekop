-- ============================================================================
-- Run this in the Supabase SQL Editor.
--
-- Fixes every "Policy Exists RLS Disabled" error in the Security Advisor by
-- (1) dropping all existing (half-applied) policies, (2) creating a complete,
-- audited policy set matching exactly what the app queries client-side, and
-- (3) enabling row level security on every table.
--
-- Access model (from a full audit of src/):
--   admin     — full access to everything (admin dashboard reads/writes
--               candidates, jobs, videos, assignments, meetings client-side)
--   employer  — own profile; own jobs; candidates/videos assigned to their
--               jobs; may set the `action` on assignments to their jobs;
--               own meeting requests
--   candidate — own profile row; own candidate_profile; own meetings/bookings;
--               own notifications
--   public    — nothing (the /start-hiring form writes via service role)
--
-- API routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS and are unaffected.
--
-- Helper functions are SECURITY DEFINER so policy checks never re-enter RLS
-- (this is what prevents the classic infinite-recursion-on-profiles bug).
-- ============================================================================

-- ── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- True when the signed-in employer has this candidate assigned to one of
-- their jobs (works for both candidate_profiles ids and video_candidates ids,
-- since assignments reference either).
create or replace function public.employer_sees_candidate(cand uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1
    from public.candidate_job_assignments a
    join public.job_requirements j on j.id = a.job_id
    where a.candidate_id = cand
      and j.employer_id = auth.uid()
  );
$$;

-- True when the signed-in employer owns this job.
create or replace function public.owns_job(job uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.job_requirements j
    where j.id = job and j.employer_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.employer_sees_candidate(uuid) to authenticated;
grant execute on function public.owns_job(uuid) to authenticated;

-- ── Reset: drop every existing policy, enable RLS on each table ────────────

do $$
declare
  t text;
  p record;
  tables text[] := array[
    'profiles', 'candidate_profiles', 'job_requirements', 'videos',
    'video_candidates', 'candidate_job_assignments', 'notifications',
    'meeting_requests', 'screening_bookings', 'employer_profiles',
    'employer_candidate_assignments', 'candidate_ai_scores', 'job_leads'
  ];
begin
  foreach t in array tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      for p in select policyname from pg_policies
               where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Everyone reads/updates/inserts only their own row; admins read all.
-- (Signup upserts the user's own row; middleware + dashboards read own role.)

create policy "own select" on public.profiles for select
  to authenticated using (id = auth.uid());
create policy "own insert" on public.profiles for insert
  to authenticated with check (id = auth.uid());
create policy "own update" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin select all" on public.profiles for select
  to authenticated using (public.is_admin());

-- ── candidate_profiles ──────────────────────────────────────────────────────
-- Candidate: own row. Admin: everything. Employer: only assigned candidates.

create policy "own all" on public.candidate_profiles for all
  to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admin all" on public.candidate_profiles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer sees assigned" on public.candidate_profiles for select
  to authenticated using (public.employer_sees_candidate(id));

-- ── job_requirements ────────────────────────────────────────────────────────
-- Admin: everything (jobs board CRUD). Employer: read own jobs.

create policy "admin all" on public.job_requirements for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer reads own jobs" on public.job_requirements for select
  to authenticated using (employer_id = auth.uid());

-- ── videos ──────────────────────────────────────────────────────────────────
-- Admin: everything (upload/replace/delete). Employer: videos of assigned
-- candidates.

create policy "admin all" on public.videos for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer sees assigned" on public.videos for select
  to authenticated using (public.employer_sees_candidate(candidate_id));

-- ── video_candidates ────────────────────────────────────────────────────────
-- Admin: everything. Employer: only assigned video candidates.

create policy "admin all" on public.video_candidates for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer sees assigned" on public.video_candidates for select
  to authenticated using (public.employer_sees_candidate(id));

-- ── candidate_job_assignments ───────────────────────────────────────────────
-- Admin: everything (matching assigns/unassigns). Employer: read assignments
-- on their jobs, and update them (the review action: request_meeting / pass).

create policy "admin all" on public.candidate_job_assignments for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer reads own" on public.candidate_job_assignments for select
  to authenticated using (public.owns_job(job_id));
create policy "employer updates own" on public.candidate_job_assignments for update
  to authenticated using (public.owns_job(job_id)) with check (public.owns_job(job_id));

-- ── notifications ───────────────────────────────────────────────────────────
-- Recipients read + mark-read their own. Inserts come from service role.

create policy "own select" on public.notifications for select
  to authenticated using (user_id = auth.uid());
create policy "own update" on public.notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── meeting_requests ────────────────────────────────────────────────────────
-- Admin: everything (meetings tab, incl. delete). Employer/candidate: read own.
-- Inserts come from the schedule-meeting API (service role).

create policy "admin all" on public.meeting_requests for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer reads own" on public.meeting_requests for select
  to authenticated using (employer_id = auth.uid());
create policy "candidate reads own" on public.meeting_requests for select
  to authenticated using (candidate_id = auth.uid());

-- ── screening_bookings ──────────────────────────────────────────────────────
-- Admin: everything. Candidate: read own. Writes come from webhooks (service).

create policy "admin all" on public.screening_bookings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "candidate reads own" on public.screening_bookings for select
  to authenticated using (candidate_id = auth.uid());

-- ── employer_profiles ───────────────────────────────────────────────────────
-- Admin: everything (jobs board reads company names). Employer: read own.

create policy "admin all" on public.employer_profiles for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own select" on public.employer_profiles for select
  to authenticated using (id = auth.uid());

-- ── employer_candidate_assignments ──────────────────────────────────────────
-- Admin: everything. Employer: read own rows.

create policy "admin all" on public.employer_candidate_assignments for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "employer reads own" on public.employer_candidate_assignments for select
  to authenticated using (employer_id = auth.uid());

-- ── candidate_ai_scores ─────────────────────────────────────────────────────
-- Admin reads cached scores in matching; writes come from the AI API (service).

create policy "admin all" on public.candidate_ai_scores for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── job_leads (legacy — only if the table still exists) ─────────────────────

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'job_leads') then
    execute 'create policy "admin all" on public.job_leads for all
             to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;
