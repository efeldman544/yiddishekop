-- Run this in the Supabase SQL Editor.
--
-- The candidate profile form and the admin candidate editor used different
-- wording for the same degrees — a candidate saved "Bachelor's Degree" while
-- the admin editor offered "Bachelor Degree". Whichever list a row was written
-- through, the other screen had no matching option, so the field rendered
-- blank there and could be wiped on the next save.
--
-- Both screens now read one shared list, which uses the candidates' wording
-- because that is what most rows already hold. This brings the remaining rows
-- — mostly admin-created and imported ones — onto that same wording, and
-- folds in the free-text spellings ("Bachelors", "BA", "PhD") that manual
-- entry produces.
--
-- Rows are matched on a normalised key (lowercased, punctuation and spaces
-- removed), so "Bachelor Degree", "bachelors" and "B.A." all land on the same
-- value. A spelling that isn't listed below is left exactly as it is rather
-- than guessed at — the check query at the bottom lists those.
--
-- Safe to re-run: only rows whose value would actually change are touched.

update public.candidate_profiles p
set education_level = c.canonical
from (values
    ('highschool',                'High School / GED'),
    ('highschoolged',             'High School / GED'),
    ('highschooldiploma',         'High School / GED'),
    ('ged',                       'High School / GED'),
    ('hs',                        'High School / GED'),

    ('somecollege',               'Some College'),

    ('associate',                 'Associate''s Degree'),
    ('associates',                'Associate''s Degree'),
    ('associatedegree',           'Associate''s Degree'),
    ('associatesdegree',          'Associate''s Degree'),
    ('aa',                        'Associate''s Degree'),
    ('as',                        'Associate''s Degree'),

    ('bachelor',                  'Bachelor''s Degree'),
    ('bachelors',                 'Bachelor''s Degree'),
    ('bachelordegree',            'Bachelor''s Degree'),
    ('bachelorsdegree',           'Bachelor''s Degree'),
    ('ba',                        'Bachelor''s Degree'),
    ('bs',                        'Bachelor''s Degree'),
    ('bsc',                       'Bachelor''s Degree'),

    ('master',                    'Master''s Degree'),
    ('masters',                   'Master''s Degree'),
    ('masterdegree',              'Master''s Degree'),
    ('mastersdegree',             'Master''s Degree'),
    ('ma',                        'Master''s Degree'),
    ('ms',                        'Master''s Degree'),
    ('msc',                       'Master''s Degree'),
    ('mba',                       'Master''s Degree'),

    ('doctorate',                 'Doctorate / PhD'),
    ('doctoral',                  'Doctorate / PhD'),
    ('doctoratephd',              'Doctorate / PhD'),
    ('phd',                       'Doctorate / PhD'),

    ('professionaldegree',        'Professional Degree (JD, MD, etc.)'),
    ('professionaldegreejdmdetc', 'Professional Degree (JD, MD, etc.)'),
    ('jd',                        'Professional Degree (JD, MD, etc.)'),
    ('md',                        'Professional Degree (JD, MD, etc.)'),

    ('trade',                     'Trade / Vocational'),
    ('vocational',                'Trade / Vocational'),
    ('tradevocational',           'Trade / Vocational'),
    ('vocationaltrade',           'Trade / Vocational'),
    ('tradeschool',               'Trade / Vocational'),

    ('other',                     'Other')
  ) as c(key, canonical)
where p.education_level is not null
  and regexp_replace(lower(p.education_level), '[^a-z0-9]', '', 'g') = c.key
  -- Only rows that actually change, so the count this reports is the number
  -- of rows repaired and a second run reports zero.
  and p.education_level is distinct from c.canonical;

-- A blank string is not a level; treat it as unanswered.
update public.candidate_profiles
set education_level = null
where education_level = '';

-- ── Check what is left ────────────────────────────────────────────────
-- Every value listed should be one of the nine the app offers. Anything else
-- is a spelling this file deliberately left alone — including ones that may
-- genuinely belong on the list rather than being mapped away, such as
-- "Yeshiva / Beis Medrash" or "Semicha". Send those over and they can be
-- added as real options.
--
--   select education_level, count(*)
--   from public.candidate_profiles
--   where education_level is not null
--   group by education_level
--   order by count(*) desc;
