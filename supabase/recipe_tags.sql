-- Run in Supabase SQL Editor (after blog_schema.sql if you use the blog)

alter table recipes add column if not exists tags text[] not null default '{}';

alter table recipe_posts add column if not exists tags text[] not null default '{}';

-- Optional: index for tag search (array contains)
create index if not exists recipes_tags_gin on recipes using gin (tags);
