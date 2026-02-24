alter table if exists public.bookclub_members
  add column if not exists display_name text not null default 'Member';
