-- =============================================================================
-- Developer One-Click Setup Manager – ALL-IN-ONE Supabase setup
-- =============================================================================
-- Run this ONCE in Supabase Dashboard → SQL Editor.
-- Safe to re-run: creates table if missing, adds column if missing, upserts seed.
-- =============================================================================

-- 1) Create table
create table if not exists public.software_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  winget_id text not null,
  category text not null,
  enabled boolean not null default true,
  icon_url text,
  created_at timestamptz not null default now()
);

-- 2) Ensure icon_url exists (for DBs created before icon_url was added)
alter table public.software_list
  add column if not exists icon_url text;

-- 3) Indexes
create index if not exists idx_software_list_enabled on public.software_list (enabled);
create index if not exists idx_software_list_category on public.software_list (category);
create unique index if not exists idx_software_list_winget_id on public.software_list (winget_id);

-- 4) RLS: allow app (anon key) to read (create policy only if missing; no DROP = no "destructive" warning)
alter table public.software_list enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'software_list' and policyname = 'Allow anon read software_list'
  ) then
    create policy "Allow anon read software_list"
      on public.software_list for select to anon using (true);
  end if;
end $$;

-- 5) Comments
comment on table public.software_list is 'Catalog of software installable via winget for Developer One-Click Setup Manager';
comment on column public.software_list.icon_url is 'URL to software icon (e.g. Clearbit or your CDN)';

-- 6) Seed default catalog (upsert: safe to re-run)
insert into public.software_list (name, winget_id, category, enabled, icon_url)
values
  ('Google Chrome', 'Google.Chrome', 'browser', true, 'https://logo.clearbit.com/google.com'),
  ('Brave Browser', 'Brave.Brave', 'browser', true, 'https://logo.clearbit.com/brave.com'),
  ('Mozilla Firefox', 'Mozilla.Firefox', 'browser', true, 'https://logo.clearbit.com/mozilla.org'),
  ('Node.js (LTS)', 'OpenJS.NodeJS.LTS', 'Development Tools', true, 'https://logo.clearbit.com/nodejs.org'),
  ('Visual Studio Code', 'Microsoft.VisualStudioCode', 'Development Tools', true, 'https://logo.clearbit.com/code.visualstudio.com'),
  ('Git', 'Git.Git', 'Development Tools', true, 'https://logo.clearbit.com/git-scm.com'),
  ('GitHub Desktop', 'GitHub.GitHubDesktop', 'Development Tools', true, 'https://logo.clearbit.com/github.com'),
  ('Postman', 'Postman.Postman', 'Development Tools', true, 'https://logo.clearbit.com/postman.com'),
  ('Docker Desktop', 'Docker.DockerDesktop', 'Development Tools', true, 'https://logo.clearbit.com/docker.com'),
  ('Python 3', 'Python.Python.3.12', 'Development Tools', true, 'https://logo.clearbit.com/python.org'),
  ('Eclipse Temurin 17', 'EclipseAdoptium.Temurin.17.JDK', 'Development Tools', true, 'https://logo.clearbit.com/adoptium.net'),
  ('MySQL', 'Oracle.MySQL', 'Development Tools', true, 'https://logo.clearbit.com/mysql.com'),
  ('MongoDB Compass', 'MongoDB.Compass', 'Development Tools', true, 'https://logo.clearbit.com/mongodb.com'),
  ('7-Zip', '7zip.7zip', 'Utilities', true, 'https://logo.clearbit.com/7-zip.org'),
  ('Notepad++', 'Notepad++.Notepad++', 'Utilities', true, 'https://logo.clearbit.com/notepad-plus-plus.org'),
  ('Microsoft PowerToys', 'Microsoft.PowerToys', 'Utilities', true, 'https://logo.clearbit.com/microsoft.com'),
  ('Figma', 'Figma.Figma', 'Utilities', true, 'https://logo.clearbit.com/figma.com'),
  ('Slack', 'SlackTechnologies.Slack', 'Utilities', true, 'https://logo.clearbit.com/slack.com')
on conflict (winget_id) do update set
  name = excluded.name,
  category = excluded.category,
  enabled = excluded.enabled,
  icon_url = excluded.icon_url;
