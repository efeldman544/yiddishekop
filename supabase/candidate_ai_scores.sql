-- Run this in your Supabase SQL Editor
-- Caches AI match scores per (job, candidate) so revisiting a job doesn't re-pay for analysis.

create table public.candidate_ai_scores (
  id           uuid default gen_random_uuid() primary key,
  job_id       uuid not null references public.job_requirements(id) on delete cascade,
  candidate_id uuid not null,  -- candidate_profiles.id OR video_candidates.id, see "source"
  source       text not null check (source in ('profile', 'video')),
  score        int not null,
  summary      text,
  strengths    jsonb default '[]',
  concerns     jsonb default '[]',
  triage_only  boolean not null default false,
  updated_at   timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index candidate_ai_scores_job_idx on public.candidate_ai_scores (job_id);

alter table public.candidate_ai_scores enable row level security;

-- Writes happen server-side via the service role (bypasses RLS); admins read from the dashboard.
create policy "Admins can view ai scores"
  on public.candidate_ai_scores for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
