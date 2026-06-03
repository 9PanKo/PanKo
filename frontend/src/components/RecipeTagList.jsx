/** PanKo — Clickable tag chips from recipe tag array. */
import { parseTags } from '../utils/tags';

export default function RecipeTagList({ tags, onTagClick, className = '' }) {
  const list = parseTags(tags);
  if (list.length === 0) return null;

  return (
    <div className={`recipe-tag-list ${className}`.trim()}>
      {list.map((tag) =>
        onTagClick ? (
          <button
            key={tag}
            type="button"
            className="recipe-tag recipe-tag--clickable"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag);
            }}
          >
            {tag}
          </button>
        ) : (
          <span key={tag} className="recipe-tag">
            {tag}
          </span>
        ),
      )}
    </div>
  );
}
