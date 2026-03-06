-- Developer One-Click Setup Manager – software_list table
-- Run this in Supabase Dashboard → SQL Editor

-- Create table (matches app: id, name, winget_id, category, enabled, icon_url, created_at)
create table if not exists public.software_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  winget_id text not null,
  category text not null,
  enabled boolean not null default true,
  icon_url text,
  created_at timestamptz not null default now()
);

-- Index for filtering by enabled and category
create index if not exists idx_software_list_enabled on public.software_list (enabled);
create index if not exists idx_software_list_category on public.software_list (category);

-- Optional: prevent duplicate winget_id
create unique index if not exists idx_software_list_winget_id on public.software_list (winget_id);

-- Allow anonymous read access (app uses anon key)
alter table public.software_list enable row level security;

drop policy if exists "Allow anon read software_list" on public.software_list;
create policy "Allow anon read software_list"
  on public.software_list
  for select
  to anon
  using (true);

-- Optional: allow anon to update only 'enabled' for toggles from app (uncomment if you add that later)
-- drop policy if exists "Allow anon update enabled" on public.software_list;
-- create policy "Allow anon update enabled"
--   on public.software_list
--   for update
--   to anon
--   using (true)
--   with check (true);

comment on table public.software_list is 'Catalog of software installable via winget for Developer One-Click Setup Manager';
