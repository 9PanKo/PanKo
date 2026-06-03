/** PanKo — Voice commands for library search / view / clear. */
import { useState, useRef, useCallback, useMemo } from 'react';
import {
  extractLibrarySearchQuery,
  extractViewRecipeQuery,
  findRecipeByVoiceTitle,
  getRecipesForVoiceView,
} from '../utils/libraryVoiceSearch';

import { VOICE_ACTIVE_LISTEN_MS } from '../utils/voiceOptions';

const LIBRARY_SEARCH_LISTEN_MS = VOICE_ACTIVE_LISTEN_MS;

export function useLibraryVoiceSearch({
  setActiveSection,
  setTagSearch,
  tagSearch = '',
  recipes = [],
  onOpenRecipe,
}) {
  const [libraryVoiceSearchActive, setLibraryVoiceSearchActive] = useState(false);
  const pendingRef = useRef(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const onFinalTranscriptRef = useRef(null);
  const recipesRef = useRef(recipes);
  const tagSearchRef = useRef(tagSearch);

  recipesRef.current = recipes;
  tagSearchRef.current = tagSearch;

  const clear = useCallback(() => {
    pendingRef.current = false;
    setLibraryVoiceSearchActive(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    setActiveSection('recipes');
    setLibraryVoiceSearchActive(true);
    pendingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(clear, LIBRARY_SEARCH_LISTEN_MS);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [clear, setActiveSection]);

  onFinalTranscriptRef.current = (text, isFinal) => {
    if (!pendingRef.current || !isFinal) return false;
    const query = text.trim();
    if (!query) return false;
    setTagSearch(query);
    clear();
    return true;
  };

  const libraryVoiceCommands = useMemo(
    () => [
      {
        word: 'clear search',
        match: (t) => /\bclear\s+search\b/.test(t),
        action: () => {
          setActiveSection('recipes');
          setTagSearch('');
          clear();
        },
      },
      {
        word: 'search',
        match: (t) => /\bsearch\b/.test(t),
        action: (spokenText) => {
          setActiveSection('recipes');
          const query = extractLibrarySearchQuery(spokenText);
          if (query) {
            setTagSearch(query);
            clear();
          } else {
            startListening();
          }
        },
      },
      {
        word: 'view',
        match: (t) => /\bview\b/.test(t),
        action: (spokenText) => {
          setActiveSection('recipes');
          const titleQuery = extractViewRecipeQuery(spokenText);
          if (!titleQuery || !onOpenRecipe) return;

          const pool = getRecipesForVoiceView(
            recipesRef.current,
            tagSearchRef.current,
          );
          const recipe = findRecipeByVoiceTitle(pool, titleQuery);
          if (recipe) {
            clear();
            onOpenRecipe(recipe.id);
          }
        },
      },
    ],
    [clear, onOpenRecipe, setActiveSection, setTagSearch, startListening],
  );

  return {
    libraryVoiceSearchActive,
    librarySearchInputRef: inputRef,
    onFinalTranscriptRef,
    libraryVoiceCommands,
    clearLibraryVoiceSearch: clear,
  };
}
