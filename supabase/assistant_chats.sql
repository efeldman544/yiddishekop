-- ═══════════════════════════════════════════════════════════════════════
-- Run this whole thing in the Supabase SQL Editor. Safe to run repeatedly.
--
-- Saved conversations with the admin Assistant. Until this is run the
-- Assistant still works, but each chat lasts only as long as its browser tab.
--
-- Each admin sees only their own chats. A chat holds whatever the Assistant
-- looked up — contact details, parts of résumés — so it is admin-only, and
-- chats untouched for 60 days are deleted by the app.
--
-- It finishes by reporting the state.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.assistant_chats (
  id          uuid primary key,
  admin_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null default '',
  messages    jsonb not null default '[]'::jsonb,
  cost_usd    numeric not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists assistant_chats_admin_updated_idx
  on public.assistant_chats (admin_id, updated_at desc);

alter table public.assistant_chats enable row level security;

drop policy if exists "Admins manage their own assistant chats" on public.assistant_chats;
create policy "Admins manage their own assistant chats"
  on public.assistant_chats for all
  to authenticated
  using (
    admin_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    admin_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Make the API see the new table now, not after its next restart.
notify pgrst, 'reload schema';

select 'assistant chats table' as check,
  case when to_regclass('public.assistant_chats') is not null then 'OK' else 'MISSING' end as result;
