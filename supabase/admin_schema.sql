-- Admin dashboard: is_admin flag, voice logs, and admin RLS policies.
-- Run in Supabase SQL Editor after blog_schema.sql

alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists account_status text not null default 'active';
alter table profiles add column if not exists email text;

alter table profiles drop constraint if exists profiles_account_status_check;
alter table profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

-- Optional: backfill emails from auth.users
-- update public.profiles p
-- set email = u.email
-- from auth.users u
-- where p.id = u.id and p.email is null;

-- Voice command analytics (populated by the app when users use voice features)
create table if not exists voice_analytics_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  command_text text not null default '',
  wake_phrase_used boolean not null default false,
  page_context text,
  created_at timestamptz not null default now()
);

alter table voice_analytics_logs enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Admin read/write for voice logs
drop policy if exists "voice_logs_admin_select" on voice_analytics_logs;
create policy "voice_logs_admin_select" on voice_analytics_logs
  for select using (public.is_admin_user());

drop policy if exists "voice_logs_insert_own" on voice_analytics_logs;
create policy "voice_logs_insert_own" on voice_analytics_logs
  for insert with check (auth.uid() = user_id or user_id is null);

-- Admin can manage all recipes
drop policy if exists "recipes_admin_all" on recipes;
create policy "recipes_admin_all" on recipes
  for all using (public.is_admin_user())
  with check (public.is_admin_user());

-- Admin can manage all blog posts
drop policy if exists "posts_admin_all" on recipe_posts;
create policy "posts_admin_all" on recipe_posts
  for all using (public.is_admin_user())
  with check (public.is_admin_user());

-- Admin can read/update all profiles (not delete auth users from client)
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles
  for update using (public.is_admin_user());

-- Set your admin account (replace email):
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'your-admin@email.com');
