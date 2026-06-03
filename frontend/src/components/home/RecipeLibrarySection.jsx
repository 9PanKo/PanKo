/** PanKo — Personal library: search, categories, recipe cards. */
import { useMemo } from 'react';
import RecipeCard from '../RecipeCard';
import LibraryVoiceHelp from './LibraryVoiceHelp';
import { categorizeLibraryRecipes, getPopularTags } from '../../utils/recipeLibrary';
import { displayNameFromProfile } from '../../utils/profile';

export default function RecipeLibrarySection({
  user,
  profile,
  recipes,
  loading,
  tagSearch,
  setTagSearch,
  libraryVoiceSearchActive,
  librarySearchInputRef,
  onCreateRecipe,
  onOpenRecipe,
  onImportToBlog,
  onDeleteRecipe,
  deletingRecipeId,
}) {
  const { filteredGeneralRecipes, filteredOwnRecipes, filteredSavedRecipes } =
    useMemo(
      () => categorizeLibraryRecipes(recipes, user?.id, tagSearch),
      [recipes, user?.id, tagSearch],
    );

  const tagSuggestions = useMemo(() => getPopularTags(recipes), [recipes]);

  const authorName = displayNameFromProfile(profile, user?.email) || 'You';

  const hasResults =
    filteredGeneralRecipes.length > 0 ||
    filteredOwnRecipes.length > 0 ||
    filteredSavedRecipes.length > 0;

  return (
    <section className="home-section">
      <div className="section-topbar">
        <h1>Recipe Library</h1>
        <div className="section-topbar__right">
          <div className="library-search__cluster">
            <LibraryVoiceHelp />
            <div className="library-search__wrap">
              <span className="library-search__icon" aria-hidden="true">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              </span>
              <input
                ref={librarySearchInputRef}
                id="library-tag-search"
                type="text"
                className={`library-search__input library-search__input--top${libraryVoiceSearchActive ? ' library-search__input--voice-active' : ''}`}
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder={
                  libraryVoiceSearchActive
                    ? 'Listening… say a title or tag'
                    : 'Search title or tags…'
                }
                aria-label="Search by title or tags"
              />
              {tagSearch && (
                <button
                  type="button"
                  className="library-search__clear"
                  onClick={() => setTagSearch('')}
                  aria-label="Clear search"
                  title="Clear"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <button type="button" className="btn" onClick={onCreateRecipe}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> ‎ Create new recipe
          </button>
        </div>
      </div>

      <p>Select a recipe to start cooking hands-free.</p>

      {libraryVoiceSearchActive && (
        <p className="library-search__voice-hint" role="status">
          <i className="fa-solid fa-microphone" aria-hidden="true" /> Say a recipe title or
          tag to search…
        </p>
      )}

      <div className="library-search">
        {tagSuggestions.length > 0 && (
          <div className="library-search__suggestions">
            <span className="library-search__suggestions-label">Popular tags:</span>
            {tagSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className="recipe-tag recipe-tag--clickable"
                onClick={() => setTagSearch(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading recipes from database...</p>
      ) : recipes.length === 0 ? (
        <p className="library-search__empty">No recipes in your library yet.</p>
      ) : !hasResults ? (
        <p className="library-search__empty">No recipes match those tags. Try another search.</p>
      ) : (
        <div className="library-categories">
          <CategoryBlock
            title="Own recipes"
            emptyMessage="No own recipes match your search."
            recipes={filteredOwnRecipes}
            onOpenRecipe={onOpenRecipe}
            onTagClick={setTagSearch}
            authorLine={`by ${authorName}`}
            showImport
            onImport={onImportToBlog}
            showDelete
            onDelete={onDeleteRecipe}
            deletingRecipeId={deletingRecipeId}
          />
          <CategoryBlock
            title="Saved recipes"
            emptyMessage="No saved recipes match your search."
            recipes={filteredSavedRecipes}
            onOpenRecipe={onOpenRecipe}
            onTagClick={setTagSearch}
            authorLine="saved from blog"
          />
          <CategoryBlock
            title="General recipes"
            emptyMessage="No general recipes match your search."
            recipes={filteredGeneralRecipes}
            onOpenRecipe={onOpenRecipe}
            onTagClick={setTagSearch}
          />
        </div>
      )}
    </section>
  );
}

function CategoryBlock({
  title,
  emptyMessage,
  recipes,
  onOpenRecipe,
  onTagClick,
  authorLine,
  showImport,
  onImport,
  showDelete,
  onDelete,
  deletingRecipeId,
}) {
  return (
    <div className="library-category">
      <h2 className="library-category__title">{title}</h2>
      {recipes.length === 0 ? (
        <p className="library-category__empty">{emptyMessage}</p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={onOpenRecipe}
              onTagClick={onTagClick}
              authorLine={authorLine}
              showImport={showImport}
              onImport={onImport}
              showDelete={showDelete}
              onDelete={onDelete}
              deleteDisabled={deletingRecipeId === recipe.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
