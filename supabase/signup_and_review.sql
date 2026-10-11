-- ═══════════════════════════════════════════════════════════════════════
-- Run this whole thing in the Supabase SQL Editor. Safe to run repeatedly.
--
-- Three things, all prompted by a spam account that signed up with a bit.ly
-- link where its name should be:
--
--   1. Link-spam can no longer be saved as somebody's name.
--   2. A new account's profile row is created by the database, not by the
--      browser — which is what lets you turn on email confirmation without
--      breaking signup (see the note in section 3).
--   3. A candidate profile starts as 'pending' and only reaches the public
--      browse page once you approve it.
--
-- It finishes by reporting the state, so you can see whether it worked
-- rather than guessing.
-- ═══════════════════════════════════════════════════════════════════════


-- ── 1. Link spam in names ──────────────────────────────────────────────

-- Clear out what's already there, or the constraint below can't be added.
-- Notifications about those accounts go too; they are the ones with the
-- spam in them.
delete from public.notifications
where message ~* '(https?://|www\.|bit\.ly|t\.me|tinyurl|<[a-z/])';

delete from auth.users
where id in (
  select id from public.profiles
  where full_name ~* '(https?://|www\.|bit\.ly|t\.me|tinyurl|<[a-z/])'
     or length(full_name) > 100
);

-- Any profile row left behind by an account that is already gone.
delete from public.profiles
where full_name ~* '(https?://|www\.|bit\.ly|t\.me|tinyurl|<[a-z/])'
   or length(full_name) > 100;

alter table public.profiles drop constraint if exists profiles_full_name_not_spam;
alter table public.profiles add constraint profiles_full_name_not_spam
  check (
    full_name is null
    or (
      length(full_name) <= 100
      -- A URL, a link shortener or a stray tag is never part of a name. Kept
      -- deliberately narrow: anything looser starts rejecting real people.
      and full_name !~* '(https?://|www\.|bit\.ly|t\.me|tinyurl|<[a-z/])'
    )
  );


-- ── 2. Where notifications point ───────────────────────────────────────

-- The bell opens /dashboard/admin/candidates/<candidate_id>, which only works
-- for a candidate. Clicking an employer signup did nothing at all, because
-- there is no such page for an employer and nothing else to go on. A row can
-- now carry its own destination.
alter table public.notifications add column if not exists link text;

update public.notifications
set link = '/dashboard/admin/employers'
where type = 'new_signup' and candidate_id is null and link is null;


-- ── 3. The profile row is created by the database ──────────────────────
--
-- Signing up wrote public.profiles from the browser. That only works while
-- the new account is signed in the instant it is created — which is to say,
-- only while email confirmation is OFF. Turn confirmation on and signUp
-- returns a user with no session, the browser's insert is refused by RLS, and
-- the account exists with no profile and therefore no role.
--
-- This trigger writes the row instead, from the metadata signUp already
-- carries, so it lands either way. Turning confirmation on in
-- Authentication -> Sign In / Providers becomes safe once this is in place.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text;
  v_email text;
  v_role  text;
  v_message text;
begin
  v_name  := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  v_email := nullif(trim(coalesce(new.email, '')), '');
  v_role  := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'candidate');
  if v_role not in ('candidate', 'employer', 'admin') then
    v_role := 'candidate';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, v_email, v_name, v_role)
  on conflict (id) do nothing;

  -- Telling the admins is worth doing but never worth losing the account
  -- over, so a failure here is swallowed. The notifications table may not
  -- even exist yet on a fresh project.
  begin
    v_message := 'New ' || v_role || ' account: ' || coalesce(v_name, v_email, 'Someone')
                 || case when v_email is not null then ' (' || v_email || ')' else '' end;

    -- The same wording the app uses, so whichever gets there first, the other
    -- one sees it and doesn't announce the same person twice.
    if not exists (
      select 1 from public.notifications
      where type = 'new_signup' and message = v_message
    ) then
      insert into public.notifications (user_id, type, candidate_id, message, link)
      select p.id, 'new_signup',
             case when v_role = 'candidate' then new.id else null end,
             v_message,
             case when v_role = 'candidate' then null else '/dashboard/admin/employers' end
      from public.profiles p
      where p.role = 'admin';
    end if;
  exception when others then
    null;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 4. A candidate profile waits for approval ──────────────────────────
--
-- Browse lists every candidate_profiles row with status = 'active', and that
-- was the default, so anyone who filled in the form was on the public page
-- immediately. Nothing checked them, which also made the claim on /why-us
-- that every profile is checked before it appears simply untrue.
--
-- New rows start as 'pending'. Rows that already exist are left exactly as
-- they are, so today's pool does not vanish from browse when you run this.

alter table public.candidate_profiles drop constraint if exists candidate_profiles_status_check;
alter table public.candidate_profiles add constraint candidate_profiles_status_check
  check (status in ('pending', 'active', 'inactive', 'placed'));

alter table public.candidate_profiles alter column status set default 'pending';


-- ── 5. Make the API see all of it now ──────────────────────────────────
-- Without this the columns can exist while the API still reports them
-- missing, which is indistinguishable from never having added them.
notify pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════
-- What the state is now. Every row should say OK.
-- ═══════════════════════════════════════════════════════════════════════
select 'spam names blocked' as check,
  case when exists (
    select 1 from pg_constraint
    where conname = 'profiles_full_name_not_spam' and conrelid = 'public.profiles'::regclass
  ) then 'OK' else 'MISSING' end as result
union all
select 'spam accounts remaining',
  case when (select count(*) from public.profiles
             where full_name ~* '(https?://|www\.|bit\.ly|t\.me|tinyurl)') = 0
       then 'OK (none)' else 'STILL PRESENT' end
union all
select 'notifications.link column',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'link'
  ) then 'OK' else 'MISSING' end
union all
select 'profile row created by trigger',
  case when exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal
  ) then 'OK — email confirmation is now safe to turn on' else 'MISSING' end
union all
select 'new candidates start pending',
  case when (
    select column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'candidate_profiles' and column_name = 'status'
  ) like '%pending%' then 'OK' else 'STILL DEFAULTS TO ACTIVE' end
union all
-- These stay visible on browse. Only profiles created from now on wait.
select 'candidates live on browse today',
  (select count(*)::text from public.candidate_profiles where status = 'active')
union all
select 'candidates waiting for approval',
  (select count(*)::text from public.candidate_profiles where status = 'pending');
