-- Run this in the Supabase SQL Editor.
--
-- Unifies inbound hire requests into job_requirements (the single source of
-- truth) instead of a separate job_leads table. A public "/start-hiring"
-- submission now becomes a job_requirements row with status 'New', source
-- 'request', and the requester's contact details — no employer account yet.
-- When that person later creates an account with the same email, the job is
-- auto-linked to them (employer_id set) so the same role is never entered twice.

-- 1. Contact + provenance columns on job_requirements
alter table public.job_requirements add column if not exists contact_name  text;
alter table public.job_requirements add column if not exists contact_email text;
alter table public.job_requirements add column if not exists contact_phone text;
alter table public.job_requirements add column if not exists source        text not null default 'admin';

create index if not exists job_requirements_contact_email_idx
  on public.job_requirements (lower(contact_email));
create index if not exists job_requirements_source_status_idx
  on public.job_requirements (source, status);

-- 2. Migrate any existing job_leads into job_requirements as 'New' requests.
--    Idempotent: skips leads already migrated (matched on email + title + time).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'job_leads'
  ) then
    insert into public.job_requirements
      (job_title, company_name, contact_name, contact_email, contact_phone,
       employment_type, hours, salary, description, status, source, created_at)
    select
      l.role_title, l.company_name, l.contact_name, l.email, l.phone,
      l.employment_type, l.hours, l.salary, l.description, 'New', 'request', l.created_at
    from public.job_leads l
    where not exists (
      select 1 from public.job_requirements r
      where r.source = 'request'
        and lower(r.contact_email) = lower(l.email)
        and r.job_title = l.role_title
        and r.created_at = l.created_at
    );
    -- Existing leads are now mirrored as job_requirements. The job_leads table
    -- is no longer read by the app; drop it once you've confirmed the migration:
    --   drop table public.job_leads;
  end if;
end $$;

-- Note: inserts from /start-hiring use the service_role key (bypasses RLS), so
-- no public insert policy is required. Admin select/delete on job_requirements
-- already exist (the Jobs board reads and deletes from it).
