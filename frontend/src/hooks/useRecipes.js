/** PanKo — Load user's recipes (+ legacy rows with null user_id). */
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshRecipes = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let query = supabase.from('recipes').select('*');

    if (currentUser) {
      query = query.or(`user_id.eq.${currentUser.id},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recipes:', error);
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  }, []);

  return { recipes, loading, refreshRecipes, setRecipes };
}
