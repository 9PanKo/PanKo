/** PanKo — Comma-separated tags with live preview chips. */
import { parseTags } from '../utils/tags';

export default function TagInput({ value, onChange, label = 'Tags', hint, id = 'recipe-tags' }) {
  const preview = parseTags(value);

  return (
    <div className="form-group tag-input">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. dinner, quick, chicken"
      />
      {hint && <p className="tag-input__hint">{hint}</p>}
      {preview.length > 0 && (
        <div className="tag-input__preview" aria-label="Tag preview">
          {preview.map((tag) => (
            <span key={tag} className="recipe-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
