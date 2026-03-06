-- Add icon_url column for app/logo image from API (run after 001 and 002)
-- Run in Supabase Dashboard → SQL Editor

alter table public.software_list
  add column if not exists icon_url text;

comment on column public.software_list.icon_url is 'URL to software icon/image (e.g. from Clearbit or your CDN)';
