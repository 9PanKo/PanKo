/** PanKo — Manual recipe editor with voice dictation for fields. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useDictation } from '../hooks/useDictation';
import { useAppNavigationVoice } from '../hooks/useAppNavigationVoice';
import VoiceAssistantFab from '../components/VoiceAssistantFab';
import TagInput from '../components/TagInput';
import { parseTags } from '../utils/tags';
import { getLastRoute } from '../utils/lastRoute';
import { useRequireActiveAccount } from '../hooks/useRequireActiveAccount';

export default function CreateRecipe() {
  const navigate = useNavigate();
  useRequireActiveAccount();
  const { isDictating, startDictating } = useDictation();
  const voice = useAppNavigationVoice();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [manualIngAmount, setManualIngAmount] = useState('');
  const [manualIngUnit, setManualIngUnit] = useState('');
  const [manualIngName, setManualIngName] = useState('');
  const [manualStep, setManualStep] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleDictateIngredient = (spokenText) => {
    const commandMatch = spokenText.match(/^(delete|remove|redo)\s+ingredient\s+(\d+)/i);

    if (commandMatch) {
      const targetIndex = parseInt(commandMatch[2], 10) - 1;
      if (targetIndex >= 0 && targetIndex < ingredients.length) {
        setIngredients((prev) => prev.filter((_, i) => i !== targetIndex));
      }
      return;
    }

    const parts = spokenText.trim().split(/\s+/);
    if (parts.length >= 3) {
      setIngredients((prev) => [
        ...prev,
        { amount: parts[0], unit: parts[1], name: parts.slice(2).join(' ') },
      ]);
    }
  };

  const handleDictateStep = (spokenText) => {
    const commandMatch = spokenText.match(/^(delete|remove|redo)\s+step\s+(\d+)/i);

    if (commandMatch) {
      const targetIndex = parseInt(commandMatch[2], 10) - 1;
      if (targetIndex >= 0 && targetIndex < steps.length) {
        setSteps((prev) => prev.filter((_, i) => i !== targetIndex));
      }
      return;
    }

    const text = spokenText.trim();
    if (text) setSteps((prev) => [...prev, text]);
  };

  const addManualIngredient = () => {
    if (!manualIngName.trim()) return;
    setIngredients((prev) => [
      ...prev,
      {
        amount: manualIngAmount.trim() || '1',
        unit: manualIngUnit.trim() || '',
        name: manualIngName.trim(),
      },
    ]);
    setManualIngAmount('');
    setManualIngUnit('');
    setManualIngName('');
  };

  const addManualStep = () => {
    const text = manualStep.trim();
    if (!text) return;
    setSteps((prev) => [...prev, text]);
    setManualStep('');
  };

  const handleSaveRecipe = async () => {
    if (!title || steps.length === 0) {
      alert('Please add a title and at least one step.');
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const row = {
      title,
      time,
      ingredients,
      steps,
      tags: parseTags(tagInput),
    };
    if (user) row.user_id = user.id;

    const { error } = await supabase.from('recipes').insert([row]);
    setSaving(false);

    if (error) {
      alert('Failed to save: ' + error.message);
    } else {
      navigate('/home?section=recipes');
    }
  };

  return (
    <div className="container create-recipe">
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => navigate(getLastRoute('/home?section=recipes'), { replace: true })}
        style={{ marginBottom: '20px' }}
      >
        <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Cancel
      </button>

      <h1>Create New Recipe</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Tap the microphone icons to dictate your recipe details. Make a mistake? Just say
        &quot;Delete step 2&quot; or &quot;Redo ingredient 1&quot;.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ flex: 2 }}>
          <label>Recipe Title</label>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chicken Adobo"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className={`btn btn-mic ${isDictating ? 'btn-mic--listening' : ''}`}
              onClick={() => startDictating(setTitle)}
              aria-label="Dictate recipe title"
            >
              <i className="fa-solid fa-microphone" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label>Total Time</label>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 45 mins"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className={`btn btn-mic ${isDictating ? 'btn-mic--listening' : ''}`}
              onClick={() => startDictating(setTime)}
              aria-label="Dictate total time"
            >
              <i className="fa-solid fa-microphone" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <TagInput
        value={tagInput}
        onChange={setTagInput}
        hint="Separate tags with commas. Use these to find recipes in your library."
      />

      <div className="panel panel--elevated" style={{ marginBottom: '20px' }}>
        <h3>Ingredients</h3>
        <ol style={{ paddingLeft: '20px' }}>
          {ingredients.map((ing, idx) => (
            <li key={idx} className="create-recipe__list-item">
              <span>
                <strong>
                  {ing.amount} {ing.unit}
                </strong>{' '}
                {ing.name}
              </span>
              <button
                type="button"
                className="create-recipe__remove"
                onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                aria-label={`Remove ingredient ${idx + 1}`}
                title="Remove"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        <div className="create-recipe__ingredient-row">
          <input
            type="text"
            className="create-recipe__field-input create-recipe__ingredient-amount"
            placeholder="Amount"
            value={manualIngAmount}
            onChange={(e) => setManualIngAmount(e.target.value)}
          />
          <input
            type="text"
            className="create-recipe__field-input create-recipe__ingredient-unit"
            placeholder="Unit"
            value={manualIngUnit}
            onChange={(e) => setManualIngUnit(e.target.value)}
          />
          <input
            type="text"
            className="create-recipe__field-input"
            placeholder="Ingredient name"
            value={manualIngName}
            onChange={(e) => setManualIngName(e.target.value)}
          />
          <button
            type="button"
            className="btn create-recipe__add"
            onClick={addManualIngredient}
            aria-label="Add ingredient"
            title="Add ingredient"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className={`btn btn-mic btn-mic--wide ${isDictating ? 'btn-mic--listening' : ''}`}
          onClick={() => startDictating(handleDictateIngredient)}
          style={{ width: '100%' }}
        >
          <i className="fa-solid fa-microphone" aria-hidden="true" /> Tap and Speak an Ingredient
        </button>
      </div>

      <div className="panel panel--elevated create-recipe__steps" style={{ marginBottom: '20px' }}>
        <h3>Steps</h3>
        <ol>
          {steps.map((step, idx) => (
            <li key={idx} className="create-recipe__list-item">
              <span>{step}</span>
              <button
                type="button"
                className="create-recipe__remove"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                aria-label={`Remove step ${idx + 1}`}
                title="Remove"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        <div className="create-recipe__step-row">
          <input
            type="text"
            className="create-recipe__field-input"
            placeholder="Type a step, then add"
            value={manualStep}
            onChange={(e) => setManualStep(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualStep()}
          />
          <button
            type="button"
            className="btn create-recipe__add"
            onClick={addManualStep}
            aria-label="Add step"
            title="Add step"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className={`btn btn-mic btn-mic--wide ${isDictating ? 'btn-mic--listening' : ''}`}
          onClick={() => startDictating(handleDictateStep)}
          style={{ width: '100%' }}
        >
          <i className="fa-solid fa-microphone" aria-hidden="true" /> Tap and Speak a Step
        </button>
      </div>

      <button
        className="btn"
        onClick={handleSaveRecipe}
        disabled={saving}
        style={{ width: '100%', height: '42px' }}
      >
        {saving ? (
          'Saving to Database...'
        ) : (
          <>
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Recipe
          </>
        )}
      </button>

      <VoiceAssistantFab
        isListening={voice.isListening}
        onToggle={voice.toggleListening}
        isSupported={voice.isSupported}
        isAwaitingCommand={voice.isAwaitingCommand}
        wakeWordMode={voice.wakeWordMode}
      />
    </div>
  );
}
