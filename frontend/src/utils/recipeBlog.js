/** PanKo — Publish a library recipe to the community blog. */
import { supabase } from '../supabaseClient';
import { ensureProfile } from './profile';

export async function importRecipeToBlog(recipe, user) {
  if (!user) return { ok: false, reason: 'not_signed_in' };

  await ensureProfile(user);

  const { error } = await supabase.from('recipe_posts').insert([
    {
      author_id: user.id,
      source_recipe_id: recipe.id,
      title: recipe.title,
      time: recipe.time,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags || [],
    },
  ]);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, reason: 'duplicate' };
    }
    return { ok: false, reason: 'error', message: error.message };
  }

  return { ok: true };
}
