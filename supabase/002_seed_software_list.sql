-- Seed default software catalog with icon_url (run after 001_create_software_list.sql and 003_add_icon_url.sql)
-- Run in Supabase Dashboard → SQL Editor
-- Uses upsert so you can re-run to add/update icon_url.

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
