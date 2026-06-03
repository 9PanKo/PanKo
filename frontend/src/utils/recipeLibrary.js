/** PanKo — Personal library filters, tags, blog-saved copies. */
import { parseTags } from './tags';

export function isSavedFromBlog(recipe) {
  return Boolean(recipe?.source_post_id);
}

export function filterRecipesBySearch(recipes, searchQuery) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return recipes;

  const terms = parseTags(q);

  return recipes.filter((recipe) => {
    const title = String(recipe?.title || '').toLowerCase();
    const titleMatch = title.includes(q);

    const tags = parseTags(recipe?.tags || []);
    const tagMatch =
      terms.length === 0
        ? tags.some((t) => t.includes(q))
        : terms.some((term) => tags.some((tag) => tag.includes(term)));

    return titleMatch || tagMatch;
  });
}

export function categorizeLibraryRecipes(recipes, userId, searchQuery) {
  const matches = filterRecipesBySearch(recipes, searchQuery);

  const isOwn = (r) =>
    Boolean(userId) && r?.user_id === userId && !isSavedFromBlog(r);
  const isSaved = (r) =>
    Boolean(userId) && r?.user_id === userId && isSavedFromBlog(r);

  return {
    filteredGeneralRecipes: matches.filter((r) => !r?.user_id),
    filteredOwnRecipes: matches.filter(isOwn),
    filteredSavedRecipes: matches.filter(isSaved),
  };
}

export function getPopularTags(recipes, limit = 5) {
  const counts = new Map();
  recipes.forEach((recipe) => {
    parseTags(recipe?.tags || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
