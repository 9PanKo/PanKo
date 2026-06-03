-- Run in Supabase SQL Editor (after blog_schema.sql)
-- Links a library recipe to a blog post created via "Import to blog"

-- recipes.id is bigint, so this column must also be bigint
alter table recipe_posts
  add column if not exists source_recipe_id bigint references recipes (id) on delete set null;

-- Prevent importing the same recipe multiple times per author
create unique index if not exists recipe_posts_author_source_recipe_unique
  on recipe_posts (author_id, source_recipe_id);

