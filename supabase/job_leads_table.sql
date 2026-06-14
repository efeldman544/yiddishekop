-- Run this in the Supabase SQL Editor to enable the employer inquiry form.
-- Creates the job_leads table and an RLS policy so only admins can read leads.
-- The /api/start-hiring route inserts using the service_role key, bypassing RLS.

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

alter table public.job_leads enable row level security;

create policy "Admins can read all leads"
  on public.job_leads
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
