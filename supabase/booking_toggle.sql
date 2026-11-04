-- ═══════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL Editor. Safe to run repeatedly.
--
-- Lets an admin turn candidate screening-call booking off and on. With it
-- off, step 2 on a candidate's dashboard stops offering a time to book and
-- says we will be in touch instead, and the booking page itself refuses --
-- so a candidate who kept the link, or typed the address, gets the same
-- answer as one who followed the button.
--
-- One row, because this is a setting for the site rather than for anybody in
-- particular. The id column can only ever be true, so a second row cannot be
-- inserted and the table cannot quietly grow a second opinion.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.site_settings (
  id          boolean primary key default true,
  screening_booking_enabled boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  constraint site_settings_one_row check (id)
);

alter table public.site_settings add column if not exists screening_booking_enabled boolean not null default true;
alter table public.site_settings add column if not exists updated_at timestamptz not null default now();
alter table public.site_settings add column if not exists updated_by uuid;

-- The row the app reads. Booking is on, which is how the site behaved before
-- there was a switch.
insert into public.site_settings (id) values (true) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- Anybody signed in may read it: a candidate's own dashboard has to know
-- whether to offer the button.
drop policy if exists "Signed in users read settings" on public.site_settings;
create policy "Signed in users read settings"
  on public.site_settings for select
  to authenticated
  using (true);

-- Only an admin may change it. Without this any candidate could switch
-- booking back on for everybody.
drop policy if exists "Admins change settings" on public.site_settings;
create policy "Admins change settings"
  on public.site_settings for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Make the API see it now. Without this the table can exist while the API
-- still reports it missing, which is indistinguishable from never having
-- created it.
notify pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════
-- What the state is now.
-- ═══════════════════════════════════════════════════════════════════════
select 'settings table' as check,
  case when to_regclass('public.site_settings') is not null then 'OK' else 'MISSING' end as result
union all
select 'the one row exists',
  case when (select count(*) from public.site_settings) = 1 then 'OK' else 'WRONG ROW COUNT' end
union all
select 'only admins can change it',
  case when exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'site_settings'
      and policyname = 'Admins change settings'
  ) then 'OK' else 'MISSING' end
union all
select 'booking is currently',
  case when (select screening_booking_enabled from public.site_settings) then 'ON' else 'OFF' end;
