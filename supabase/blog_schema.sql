-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- User display names for blog posts
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- Public recipe blog posts
create table if not exists recipe_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  time text default '30 mins',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists recipe_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references recipe_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

create table if not exists recipe_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references recipe_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists recipe_post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references recipe_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- Link personal library recipes to blog posts and owners
alter table recipes add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table recipes add column if not exists source_post_id uuid references recipe_posts (id) on delete set null;

-- RLS
alter table profiles enable row level security;
alter table recipe_posts enable row level security;
alter table recipe_post_likes enable row level security;
alter table recipe_post_comments enable row level security;
alter table recipe_post_saves enable row level security;

create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "posts_select" on recipe_posts for select using (true);
create policy "posts_insert_own" on recipe_posts for insert with check (auth.uid() = author_id);
create policy "posts_delete_own" on recipe_posts for delete using (auth.uid() = author_id);

create policy "likes_select" on recipe_post_likes for select using (true);
create policy "likes_insert_own" on recipe_post_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on recipe_post_likes for delete using (auth.uid() = user_id);

create policy "comments_select" on recipe_post_comments for select using (true);
create policy "comments_insert_own" on recipe_post_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on recipe_post_comments for delete using (auth.uid() = user_id);

create policy "saves_select" on recipe_post_saves for select using (auth.uid() = user_id);
create policy "saves_insert_own" on recipe_post_saves for insert with check (auth.uid() = user_id);
create policy "saves_delete_own" on recipe_post_saves for delete using (auth.uid() = user_id);

-- Optional: restrict personal recipes to owner (adjust if you had public recipes before)
-- alter table recipes enable row level security;
-- create policy "recipes_select_own" on recipes for select using (auth.uid() = user_id or user_id is null);
-- create policy "recipes_insert_own" on recipes for insert with check (auth.uid() = user_id);
-- create policy "recipes_update_own" on recipes for update using (auth.uid() = user_id);
-- create policy "recipes_delete_own" on recipes for delete using (auth.uid() = user_id);
