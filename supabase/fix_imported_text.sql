-- Run this in the Supabase SQL Editor.
--
-- Repairs two data-quality problems introduced by candidate imports.
--
-- 1. Mis-decoded characters. An en-dash written as Windows-1252 (byte 0x96)
--    isn't valid UTF-8, so it landed in the database as U+FFFD — the "5<>7
--    years" you see rendered as a black diamond question mark. In a text
--    column the bad byte is already gone, so the best repair is to put the
--    dash back where it sat between digits and drop it elsewhere.
--
-- 2. Employment-type variants. "Full-time" and "Full Time" are different
--    strings, so a candidate stored with one never matched a filter for the
--    other and silently disappeared from browse results.

-- ── 1. Mis-decoded characters ─────────────────────────────────────────

-- Between digits it was a range dash: "5<>7 years" -> "5–7 years"
update public.candidate_profiles
set years_experience = replace(years_experience, U&'\FFFD', U&'\2013')
where years_experience like '%' || U&'\FFFD' || '%';

-- Everywhere else it's unrecoverable noise — remove it
update public.candidate_profiles set full_name = replace(full_name, U&'\FFFD', '')
where full_name like '%' || U&'\FFFD' || '%';
update public.candidate_profiles set location = replace(location, U&'\FFFD', '')
where location like '%' || U&'\FFFD' || '%';
update public.candidate_profiles set current_job_title = replace(current_job_title, U&'\FFFD', '')
where current_job_title like '%' || U&'\FFFD' || '%';
update public.candidate_profiles set languages = replace(languages, U&'\FFFD', '')
where languages like '%' || U&'\FFFD' || '%';
update public.candidate_profiles set roles_seeking = replace(roles_seeking, U&'\FFFD', '')
where roles_seeking like '%' || U&'\FFFD' || '%';
update public.candidate_profiles set tools_software = replace(tools_software, U&'\FFFD', '')
where tools_software like '%' || U&'\FFFD' || '%';

update public.video_candidates set name = replace(name, U&'\FFFD', '')
where name like '%' || U&'\FFFD' || '%';
update public.video_candidates set current_job_title = replace(current_job_title, U&'\FFFD', '')
where current_job_title like '%' || U&'\FFFD' || '%';

-- ── 2. Employment-type variants ───────────────────────────────────────

update public.candidate_profiles
set employment_type = (
  select array_agg(distinct case
    when lower(replace(e, '-', ' ')) in ('full time', 'fulltime') then 'Full Time'
    when lower(replace(e, '-', ' ')) in ('part time', 'parttime') then 'Part Time'
    when lower(e) like 'contract%' or lower(e) like 'freelance%' then 'Contract'
    else e
  end)
  from unnest(employment_type) as e
)
where employment_type is not null and array_length(employment_type, 1) > 0;

update public.video_candidates
set employment_type = (
  select array_agg(distinct case
    when lower(replace(e, '-', ' ')) in ('full time', 'fulltime') then 'Full Time'
    when lower(replace(e, '-', ' ')) in ('part time', 'parttime') then 'Part Time'
    when lower(e) like 'contract%' or lower(e) like 'freelance%' then 'Contract'
    else e
  end)
  from unnest(employment_type) as e
)
where employment_type is not null and array_length(employment_type, 1) > 0;

-- Check what's left afterwards:
--   select distinct unnest(employment_type) from public.candidate_profiles order by 1;
--   select distinct unnest(fields_worked_in) from public.candidate_profiles order by 1;
