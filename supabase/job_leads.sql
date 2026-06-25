-- Run this in the Supabase SQL Editor.
-- Creates the job_leads table used by the /start-hiring form.
-- Inserts come from the API route using the service_role key (bypasses RLS).
-- Reads come from the admin dashboard (authenticated admin users only).

create table if not exists public.job_leads (
  id              uuid primary key default gen_random_uuid(),
  contact_name    text not null,
  email           text not null,
  phone           text,
  company_name    text,
  role_title      text not null,
  employment_type text,
  hours           text,
  salary          text,
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists job_leads_created_at_idx
  on public.job_leads (created_at desc);

alter table public.job_leads enable row level security;

-- Only admins can read job leads
drop policy if exists "Admins read job leads" on public.job_leads;
create policy "Admins read job leads"
  on public.job_leads for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- Only admins can delete job leads
drop policy if exists "Admins delete job leads" on public.job_leads;
create policy "Admins delete job leads"
  on public.job_leads for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
