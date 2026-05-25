-- Run this in your Supabase SQL Editor
-- If you ran the previous version, drop it first:
-- drop table if exists public.candidate_profiles;

create table public.candidate_profiles (
  id               uuid references public.profiles(id) on delete cascade primary key,
  full_name        text,
  email            text,
  phone            text,
  whatsapp         text,
  location         text,
  current_job_title text,
  education_level  text,
  years_experience text,
  fields_worked_in text[] default '{}',
  tools_software   text,
  languages        text,
  roles_seeking    text,
  employment_type  text[] default '{}',
  desired_salary   text,
  currency         text,
  us_hours_comfortable boolean,
  remote_experience    boolean,
  resume_url       text,
  status           text not null default 'active' check (status in ('active', 'inactive', 'placed')),
  updated_at       timestamptz default now()
);

-- Row Level Security
alter table public.candidate_profiles enable row level security;

create policy "Candidates can manage own profile"
  on public.candidate_profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Employers and admins can view candidate profiles"
  on public.candidate_profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('employer', 'admin')
    )
  );

-- Storage bucket for resumes
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a bucket named "resumes", set to private
-- 3. Then run the policies below:

create policy "Candidates can upload own resume"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Candidates can read own resume"
  on storage.objects for select
  using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Candidates can update own resume"
  on storage.objects for update
  using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
