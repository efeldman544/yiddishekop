-- Run this in the Supabase SQL Editor.
--
-- When an employer clicks "Request introduction" on /browse, this records it
-- so it lands in a queue you can work through, instead of only firing a
-- notification that's easy to miss or clear by accident.

-- Non-recursive admin check (same helper enable_rls.sql installs; repeated
-- here so this file can be run on its own).
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.introduction_requests (
  id             uuid primary key default gen_random_uuid(),
  employer_id    uuid not null references public.profiles(id) on delete cascade,
  candidate_id   uuid,
  candidate_name text,
  candidate_ref  text,
  note           text,
  status         text not null default 'new' check (status in ('new', 'actioned', 'dismissed')),
  created_at     timestamptz not null default now()
);

create index if not exists introduction_requests_created_at_idx
  on public.introduction_requests (created_at desc);
create index if not exists introduction_requests_employer_idx
  on public.introduction_requests (employer_id);

alter table public.introduction_requests enable row level security;

-- Admins work the queue
drop policy if exists "Admins manage introduction requests" on public.introduction_requests;
create policy "Admins manage introduction requests"
  on public.introduction_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Employers can see the ones they raised
drop policy if exists "Employers read own introduction requests" on public.introduction_requests;
create policy "Employers read own introduction requests"
  on public.introduction_requests for select
  to authenticated
  using (employer_id = auth.uid());

-- Inserts come from the API using the service-role key, so no insert policy
-- is needed for employers.
