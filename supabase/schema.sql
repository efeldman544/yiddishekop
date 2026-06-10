-- Run this in your Supabase SQL Editor

-- 1. Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('candidate', 'employer', 'admin')) default 'candidate',
  created_at timestamptz default now()
);

-- 2. Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not role)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── job_leads: inbound "start hiring" requests from the public landing page ──
-- Run this in your Supabase SQL Editor to enable the /start-hiring form.

create table public.job_leads (
  id            uuid default gen_random_uuid() primary key,
  contact_name  text not null,
  email         text not null,
  phone         text,
  company_name  text,
  role_title    text not null,
  employment_type text,
  hours         text,
  salary        text,
  description   text,
  created_at    timestamptz default now()
);

alter table public.job_leads enable row level security;

-- Anyone (including unauthenticated visitors) can submit a lead
create policy "Public can insert job leads"
  on public.job_leads for insert
  with check (true);

-- Only admins can view submissions
create policy "Admins can view job leads"
  on public.job_leads for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
