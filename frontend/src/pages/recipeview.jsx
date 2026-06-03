/** PanKo — Step-by-step recipe view with hands-free voice (next/back/read/convert). */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import VoiceAssistantFab from '../components/VoiceAssistantFab';
import { RECIPE_VIEW_VOICE_OPTIONS } from '../utils/voiceOptions';
import { supabase } from '../supabaseClient';
import RecipeTagList from '../components/RecipeTagList';
import { useRequireActiveAccount } from '../hooks/useRequireActiveAccount';
import { apiPost } from '../utils/api';

export default function RecipeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  useRequireActiveAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentStepRef = useRef(0);
  const recipeRef = useRef(null);

  currentStepRef.current = currentStep;
  recipeRef.current = recipe;

  useEffect(() => {
    const fetchSingleRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching recipe:", error);
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    fetchSingleRecipe();
  }, [id]);

  const speakRef = useRef(() => {});

  const commands = useMemo(() => {
    if (!recipe) return [];

    const runConversion = async (spokenText) => {
      const match = spokenText.match(/convert (\d+(?:\.\d+)?) ([a-z]+) to ([a-z]+)/i);

      if (!match) {
        speakRef.current(
          "I heard you ask for a conversion, but I didn't catch the amounts. Say it like: convert 500 ml to liters.",
        );
        return;
      }

      const amount = match[1];
      let fromUnit = match[2].toLowerCase();
      let toUnit = match[3].toLowerCase();

      const unitTranslator = {
        milliliters: 'ml',
        milliliter: 'ml',
        liters: 'l',
        liter: 'l',
        grams: 'g',
        gram: 'g',
        kilograms: 'kg',
        kilogram: 'kg',
        tablespoons: 'tbsp',
        tablespoon: 'tbsp',
        teaspoons: 'tsp',
        teaspoon: 'tsp',
      };

      fromUnit = unitTranslator[fromUnit] || fromUnit;
      toUnit = unitTranslator[toUnit] || toUnit;

      try {
        const data = await apiPost('/api/convert', {
          amount,
          from_unit: fromUnit,
          to_unit: toUnit,
        });

        if (data.status === 'success') {
          speakRef.current(data.result);
        } else {
          speakRef.current("Sorry, I don't know how to convert those specific units yet.");
        }
      } catch (error) {
        console.error(error);
        speakRef.current('Sorry, my math engine is currently offline.');
      }
    };

    return [
      {
        word: 'next',
        action: () =>
          setCurrentStep((prev) =>
            Math.min(prev + 1, recipe.steps.length - 1),
          ),
      },
      {
        word: 'back',
        action: () => setCurrentStep((prev) => Math.max(prev - 1, 0)),
      },
      {
        word: 'read',
        action: () => {
          const r = recipeRef.current;
          const step = currentStepRef.current;
          if (r?.steps?.[step]) {
            speakRef.current(r.steps[step]);
          }
        },
      },
      {
        word: 'repeat',
        action: () => {
          const r = recipeRef.current;
          const step = currentStepRef.current;
          if (r?.steps?.[step]) {
            speakRef.current(r.steps[step]);
          }
        },
      },
      {
        word: 'convert',
        action: (fullSentence) => runConversion(fullSentence),
      },
    ];
  }, [recipe]);

  const {
    isListening,
    toggleListening,
    transcript,
    speak,
    isSupported,
    isAwaitingCommand,
    wakeWordMode,
    directCommandsMode,
  } = useVoiceAssistant(commands, RECIPE_VIEW_VOICE_OPTIONS);

  speakRef.current = speak;

  const triggerReadAloud = (stepIndex) => {
    const r = recipeRef.current;
    if (r?.steps?.[stepIndex]) {
      speak(r.steps[stepIndex]);
    }
  };

  if (!isSupported) {
    return <div className="container"><h2>⚠️ Please use Google Chrome or Edge for voice features.</h2></div>;
  }

  if (loading) {
    return <div className="container"><h2>Loading your recipe...</h2></div>;
  }

  if (!recipe) {
    return <div className="container"><h2>Recipe not found.</h2><button className="btn" onClick={() => navigate('/home?section=recipes')}>Go Back</button></div>;
  }

  return (
    <div className="container">
      <button type="button" className="btn btn--secondary" onClick={() => navigate('/home?section=recipes')} style={{ marginBottom: '20px' }}>
      <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to Library
      </button>
      
      <h1>{recipe.title}</h1>
      <div className="recipeview__tags">
        <RecipeTagList tags={recipe.tags} />
      </div>

      <div className="panel panel--elevated" style={{ marginBottom: '25px' }}>
        <h3>Ingredients Checklist</h3>
        <ul style={{ columns: 2, paddingLeft: '20px', margin: 0 }}>
          {recipe.ingredients && recipe.ingredients.map((ing, index) => (
            <li key={index} style={{ marginBottom: '8px', fontSize: '1.1rem' }}>
              <strong>{ing.amount} {ing.unit}</strong> — {ing.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Current step */}
      <div className="recipe-step-panel">
        <p className="recipe-step-panel__label">
          Step {currentStep + 1} of {recipe.steps.length}
        </p>
        <p className="recipe-step-panel__text">
          {recipe.steps[currentStep]}
        </p>
      </div>

      <details className="recipeview-steps">
        <summary className="recipeview-steps__summary">
          <span className="recipeview-steps__summary-text">
            All steps ({recipe.steps.length})
          </span>
          <i className="fa-solid fa-chevron-down recipeview-steps__chevron" aria-hidden="true" />
        </summary>
        <ol className="recipeview-steps__list">
          {recipe.steps.map((step, index) => (
            <li
              key={index}
              className={
                index === currentStep
                  ? 'recipeview-steps__item recipeview-steps__item--active'
                  : 'recipeview-steps__item'
              }
            >
              <span className="recipeview-steps__number">Step {index + 1}</span>
              <span className="recipeview-steps__body">{step}</span>
            </li>
          ))}
        </ol>
      </details>

      {/* Step controls */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
        <button 
          className="btn" 
          onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        <button 
          className="btn" 
          onClick={() => triggerReadAloud(currentStep)}
        >
          Read Step
        </button>
        <button 
          className="btn" 
          onClick={() => setCurrentStep(prev => Math.min(prev + 1, recipe.steps.length - 1))}
          disabled={currentStep === recipe.steps.length - 1}
        >
          Next
        </button>
      </div>

      {/* Voice feedback */}
      <div className="voice-console">
        <p className="voice-console__label">Last heard: <em style={{ color: 'var(--text)' }}>{transcript || "Nothing yet..."}</em></p>
        <p className="voice-hint">
          Say &quot;Next&quot;, &quot;Back&quot;, &quot;Read&quot;, or &quot;Repeat&quot;
        </p>
      </div>

      <VoiceAssistantFab
        isListening={isListening}
        onToggle={toggleListening}
        isSupported={isSupported}
        isAwaitingCommand={isAwaitingCommand}
        wakeWordMode={wakeWordMode}
        directCommandsMode={directCommandsMode}
      />
    </div>
  );
}