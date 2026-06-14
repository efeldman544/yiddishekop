-- Run this in the Supabase SQL Editor.
-- Creates the notifications table with the RLS policies and realtime publication
-- the in-app bell depends on. Without these, the bell's SELECT returns nothing
-- (RLS denies) and live INSERT events never arrive (table not in the realtime
-- publication) — i.e. "notifications don't work".
--
-- Inserts are performed by API routes using the service_role key, which bypasses
-- RLS, so no INSERT policy is needed.

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text,
  message      text not null,
  candidate_id uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Recipients can read their own notifications
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Recipients can mark their own notifications read
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable realtime so the bell receives live INSERTs (idempotent: ignore if already added)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;
