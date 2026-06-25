-- Run this in your Supabase SQL Editor to set up the trading co-pilot memory table

create table public.trading_memory (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  lesson      text not null,
  category    text default 'general',
  created_at  timestamptz default now()
);

alter table public.trading_memory enable row level security;

create policy "Users can manage own memories"
  on public.trading_memory
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index trading_memory_user_id_idx on public.trading_memory(user_id, created_at desc);
