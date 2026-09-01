-- ═══════════════════════════════════════════════════════════════════════
-- Run this whole thing in the Supabase SQL Editor. Safe to run repeatedly.
--
-- Fixes the "the employer wasn't notified" error, and finishes by reporting
-- what the state actually is so you can see whether it worked rather than
-- guessing.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. The table the bell reads and every notification writes to.
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text,
  message      text not null,
  candidate_id uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- If an older version of the table exists, make sure it has every column the
-- app writes. A missing column fails the insert just as hard as a missing table.
alter table public.notifications add column if not exists type         text;
alter table public.notifications add column if not exists candidate_id uuid;
alter table public.notifications add column if not exists read         boolean not null default false;
alter table public.notifications add column if not exists created_at   timestamptz not null default now();

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- 2. Row level security. Inserts come from the server using the service_role
--    key, which bypasses RLS, so only read/update policies are needed.
alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Realtime, so the bell lights up without a refresh.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- 4. Make the API see it now. Without this the table can exist while the API
--    still reports it missing, which is indistinguishable from never having
--    created it.
notify pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════
-- What the state is now. Every row should say OK.
-- ═══════════════════════════════════════════════════════════════════════
select
  'notifications table'  as check,
  case when to_regclass('public.notifications') is not null
       then 'OK' else 'MISSING' end as result
union all
select
  'all columns present',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications'
      and column_name in ('id','user_id','type','message','candidate_id','read','created_at')
  ) = 7 then 'OK' else 'MISSING COLUMNS' end
union all
select
  'realtime enabled',
  case when exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then 'OK' else 'NOT PUBLISHED' end
union all
select
  'read policy',
  case when exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
      and policyname = 'Users read own notifications'
  ) then 'OK' else 'MISSING' end
union all
-- If this says NONE, notifications are being written nowhere: every "notify
-- the admins" call looks up profiles with role = 'admin' and finds nobody.
select
  'admin accounts',
  case when (select count(*) from public.profiles where role = 'admin') > 0
       then 'OK (' || (select count(*) from public.profiles where role = 'admin') || ')'
       else 'NONE — no profile has role = admin' end
union all
select
  'notifications stored so far',
  (select count(*)::text from public.notifications);
