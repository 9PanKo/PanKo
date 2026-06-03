/** PanKo — Library recipe card (open, tags, import, delete). */
import RecipeTagList from './RecipeTagList';

export default function RecipeCard({
  recipe,
  onOpen,
  onTagClick,
  authorLine,
  showImport,
  onImport,
  showDelete,
  onDelete,
  deleteDisabled,
}) {
  const hasActions = showImport || showDelete;

  return (
    <div
      className="recipe-card"
      onClick={() => onOpen(recipe.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(recipe.id);
      }}
      role="button"
      tabIndex={0}
    >
      {hasActions ? (
        <div className="recipe-card__top">
          <h3 className="recipe-card__title">{recipe.title}</h3>
          <div className="recipe-card__actions">
            {showImport && (
              <button
                type="button"
                className="recipe-card__import"
                onClick={(e) => {
                  e.stopPropagation();
                  onImport(recipe);
                }}
                title="Import to blog"
                aria-label="Import to blog"
              >
                <i className="fa-solid fa-upload" aria-hidden="true" />
              </button>
            )}
            {showDelete && (
              <button
                type="button"
                className="recipe-card__delete"
                disabled={deleteDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe);
                }}
                title="Delete recipe"
                aria-label="Delete recipe"
              >
                <i className="fa-solid fa-trash" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <h3 className="recipe-card__title">{recipe.title}</h3>
      )}
      <p>⏱ {recipe.time}</p>
      {authorLine && <p className="recipe-card__author">{authorLine}</p>}
      <RecipeTagList tags={recipe.tags} onTagClick={onTagClick} />
    </div>
  );
}
