/** PanKo — Admin create/edit recipe modal. */
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';

import TagInput from '../TagInput';
import { parseTags } from '../../utils/tags';

function tagsToInput(tags) {
  if (!tags) return '';
  if (Array.isArray(tags)) return tags.join(', ');
  return String(tags);
}

function createIngredient(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    amount: '',
    unit: '',
    name: '',
    ...overrides,
  };
}

function createStep(text = '') {
  return {
    id: crypto.randomUUID(),
    text,
  };
}

function normalizeIngredients(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [createIngredient()];
  }
  return list.map((item) =>
    createIngredient({
      amount: item?.amount ?? '',
      unit: item?.unit ?? '',
      name: item?.name ?? '',
    }),
  );
}

function normalizeSteps(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [createStep()];
  }
  return list.map((item) =>
    createStep(typeof item === 'string' ? item : item?.text || ''),
  );
}


export default function AdminRecipeModal({ open, mode, recipe, saving, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [ingredients, setIngredients] = useState([createIngredient()]);
  const [steps, setSteps] = useState([createStep()]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && recipe) {
      setTitle(recipe.title || '');
      setTime(recipe.time || '');
      setTagInput(tagsToInput(recipe.tags));
      setIngredients(normalizeIngredients(recipe.ingredients));
      setSteps(normalizeSteps(recipe.steps));
      setFormError('');
      return;
    }

    setTitle('');
    setTime('');
    setTagInput('');
    setIngredients([createIngredient()]);
    setSteps([createStep()]);
    setFormError('');
  }, [open, mode, recipe]);

  if (!open) return null;

  const updateIngredient = (id, field, value) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeIngredient = (id) => {
    setIngredients((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createIngredient()];
    });
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, createIngredient()]);
  };

  const updateStep = (id, value) => {
    setSteps((prev) => prev.map((item) => (item.id === id ? { ...item, text: value } : item)));
  };

  const removeStep = (id) => {
    setSteps((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createStep()];
    });
  };

  const addStep = () => {
    setSteps((prev) => [...prev, createStep()]);
  };

  const moveStep = (index, direction) => {
    setSteps((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    const payload = {
      id: recipe?.id ?? null,
      title: title.trim(),
      time: time.trim(),
      tags: parseTags(tagInput),
      ingredients: ingredients
        .filter((item) => item.name.trim())
        .map(({ amount, unit, name }) => ({
          amount: amount.trim() || '1',
          unit: unit.trim(),
          name: name.trim(),
        })),
      steps: steps.map((item) => item.text.trim()).filter(Boolean),
    };

    if (!payload.steps.length) {
      setFormError('Add at least one step.');
      return;
    }

    onSave?.(mode, payload);
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal admin-recipe-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-recipe-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title" id="admin-recipe-modal-title">
            {mode === 'edit' ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <form className="modal__body admin-recipe-modal__form" onSubmit={handleSubmit}>
          <div className="admin-recipe-modal__row">
            <label className="admin-recipe-modal__field admin-recipe-modal__field--grow">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Chicken Adobo"
                required
              />
            </label>
            <label className="admin-recipe-modal__field">
              <span>Time</span>
              <input
                type="text"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder="e.g. 45 mins"
              />
            </label>
          </div>

          <TagInput
            value={tagInput}
            onChange={setTagInput}
            hint="Comma-separated tags used for library categories and search."
          />

          {formError && <div className="login-error">{formError}</div>}

          <section className="admin-recipe-modal__section">
            <div className="admin-recipe-modal__section-head">
              <h3>Ingredients</h3>
              <button type="button" className="btn btn--secondary admin-recipe-modal__add-btn" onClick={addIngredient}>
                <Plus size={16} strokeWidth={2} aria-hidden="true" />
                Add Ingredient
              </button>
            </div>

            <ul className="admin-recipe-modal__ingredient-list">
              {ingredients.map((item) => (
                <li key={item.id} className="admin-recipe-modal__ingredient-row">
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(event) => updateIngredient(item.id, 'amount', event.target.value)}
                    placeholder="Amount"
                    aria-label="Ingredient amount"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(event) => updateIngredient(item.id, 'unit', event.target.value)}
                    placeholder="Unit"
                    aria-label="Ingredient unit"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(event) => updateIngredient(item.id, 'name', event.target.value)}
                    placeholder="Ingredient name"
                    aria-label="Ingredient name"
                    className="admin-recipe-modal__ingredient-name"
                  />
                  <button
                    type="button"
                    className="admin-recipe-modal__icon-btn"
                    onClick={() => removeIngredient(item.id)}
                    aria-label="Remove ingredient"
                    title="Remove ingredient"
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="admin-recipe-modal__section">
            <div className="admin-recipe-modal__section-head">
              <h3>Steps</h3>
              <button type="button" className="btn btn--secondary admin-recipe-modal__add-btn" onClick={addStep}>
                <Plus size={16} strokeWidth={2} aria-hidden="true" />
                Add Step
              </button>
            </div>

            <ol className="admin-recipe-modal__step-list">
              {steps.map((item, index) => (
                <li key={item.id} className="admin-recipe-modal__step-row">
                  <span className="admin-recipe-modal__step-number">{index + 1}</span>
                  <textarea
                    value={item.text}
                    onChange={(event) => updateStep(item.id, event.target.value)}
                    placeholder={`Step ${index + 1} instructions`}
                    rows={2}
                    aria-label={`Step ${index + 1}`}
                  />
                  <div className="admin-recipe-modal__step-actions">
                    <button
                      type="button"
                      className="admin-recipe-modal__icon-btn"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      aria-label="Move step up"
                      title="Move up"
                    >
                      <ChevronUp size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="admin-recipe-modal__icon-btn"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      aria-label="Move step down"
                      title="Move down"
                    >
                      <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="admin-recipe-modal__icon-btn"
                      onClick={() => removeStep(item.id)}
                      aria-label="Remove step"
                      title="Remove step"
                    >
                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
