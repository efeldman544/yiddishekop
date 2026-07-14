-- Run this in the Supabase SQL Editor.
--
-- Fixes "infinite recursion detected in policy for relation profiles".
--
-- The old policy checked admin-ness by selecting FROM profiles inside a policy
-- ON profiles, which recurses. Any table whose admin RLS check reads profiles
-- (videos, video_candidates, job_requirements, candidate_profiles, …) then
-- fails with the same error — which is why video uploads and admin reads break.
--
-- The fix: a SECURITY DEFINER function that reads profiles with the definer's
-- privileges (bypassing RLS), so the check never re-enters profiles' policies.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Let authenticated users execute it (it only returns a boolean about themselves)
grant execute on function public.is_admin() to authenticated;

-- Replace the self-recursive admin SELECT policy on profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Optional but recommended: point other tables' admin policies at is_admin()
-- too, so none of them re-enter profiles' policies. Safe to run repeatedly.
do $$
declare
  t text;
  admin_tables text[] := array[
    'videos', 'video_candidates', 'job_requirements', 'candidate_profiles',
    'candidate_job_assignments', 'employer_candidate_assignments',
    'employer_profiles', 'candidate_ai_scores', 'notifications', 'job_leads'
  ];
begin
  foreach t in array admin_tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      -- Recreate a uniform admin-all policy using the non-recursive function.
      execute format('drop policy if exists "Admins full access via is_admin" on public.%I', t);
      execute format(
        'create policy "Admins full access via is_admin" on public.%I '
        || 'using (public.is_admin()) with check (public.is_admin())', t);
    end if;
  end loop;
end $$;
