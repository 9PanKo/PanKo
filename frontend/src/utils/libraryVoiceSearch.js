/** PanKo — Parse "search" / "view" voice phrases for the library. */
import { normalizeSpeech } from './wakePhrase';
import { filterRecipesBySearch } from './recipeLibrary';

/** Text after the word "search" in a voice command (title or tags). */
export function extractLibrarySearchQuery(spokenText) {
  const normalized = normalizeSpeech(spokenText);
  const match = normalized.match(/\bsearch\b(.*)$/);
  if (!match) return '';
  return match[1].trim();
}

/** Text after the word "view" in a voice command (recipe title). */
export function extractViewRecipeQuery(spokenText) {
  const normalized = normalizeSpeech(spokenText);
  const match = normalized.match(/\bview\b(.*)$/);
  if (!match) return '';
  return match[1].trim();
}

/** Resolve a spoken title to a recipe in the given list. */
export function findRecipeByVoiceTitle(recipes, query) {
  const q = normalizeSpeech(query).trim();
  if (!q || !recipes?.length) return null;

  const entries = recipes.map((recipe) => ({
    recipe,
    title: normalizeSpeech(String(recipe.title || '')),
  }));

  const exact = entries.find((e) => e.title === q);
  if (exact) return exact.recipe;

  const partial = entries.filter(
    (e) => e.title.includes(q) || q.includes(e.title),
  );
  if (partial.length === 0) return null;
  if (partial.length === 1) return partial[0].recipe;

  const startsWith = partial.filter((e) => e.title.startsWith(q));
  const ranked = (startsWith.length ? startsWith : partial).sort(
    (a, b) => a.title.length - b.title.length,
  );
  return ranked[0].recipe;
}

export function getRecipesForVoiceView(allRecipes, tagSearch) {
  const trimmed = tagSearch?.trim() || '';
  if (!trimmed) return allRecipes || [];
  return filterRecipesBySearch(allRecipes || [], trimmed);
}
