/** PanKo — Chef's Eye: camera/upload → Gemini recipe → save to library. */
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TagInput from '../components/TagInput';
import { parseTags } from '../utils/tags';
import { apiPost } from '../utils/api';

export default function ChefsEye({ onSaved }) {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  }, [cameraOpen]);

  const openCamera = async () => {
    if (analyzing) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera is still loading. Please wait a moment.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          alert('Could not capture the photo. Please try again.');
          return;
        }
        stopCamera();
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        await processImageFile(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, etc.).');
      return;
    }

    setAnalyzing(true);
    setRecipe(null);
    setTagInput('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result?.split(',')[1];
      if (!base64String) {
        alert('Could not read the image. Please try again.');
        setAnalyzing(false);
        return;
      }

      try {
        const data = await apiPost('/api/vision-recipe', { image: base64String });

        if (data.status === 'success') {
          setRecipe(data.recipe);
          const aiTags = data.recipe?.tags || data.recipe?.Tags;
          if (aiTags?.length) {
            setTagInput(Array.isArray(aiTags) ? aiTags.join(', ') : String(aiTags));
          }
        } else {
          alert('AI Failed: ' + data.message);
        }
      } catch {
        alert('Could not connect to the vision server. Is the backend running on port 5000?');
      }
      setAnalyzing(false);
    };
    reader.onerror = () => {
      alert('Could not read the image. Please try again.');
      setAnalyzing(false);
    };
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      await processImageFile(file);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const row = {
      title: recipe.title || recipe.Title || 'AI Recipe',
      time: recipe.time || recipe.Time || '30 mins',
      ingredients: recipe.ingredients || recipe.Ingredients || [],
      steps: recipe.steps || recipe.Steps || [],
      tags: parseTags(tagInput),
    };
    if (user) row.user_id = user.id;

    const { error } = await supabase.from('recipes').insert([row]);

    setSaving(false);

    if (error) {
      alert('Failed to save recipe: ' + error.message);
    } else {
      alert('AI Recipe saved successfully!');
      if (onSaved) {
        onSaved();
      } else {
        navigate('/home');
      }
    }
  };

  return (
    <div className="chefseye">
      <div className="chefseye__header">
        <h1 className="chefseye__title">Chef's Eye</h1>
        <p className="chefseye__subtitle">
          Don't know what to cook? Take a photo of the ingredients in your fridge, and our AI Chef will invent a custom recipe for you instantly.
        </p>
      </div>

      {/* Camera / file upload */}
      <div className="chefseye-upload">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="chefseye-upload__input"
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="chefseye-upload__input"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="chefseye-upload__actions">
          <button
            type="button"
            className="btn chefseye-upload__btn"
            onClick={openCamera}
            disabled={analyzing}
          >
            <i className="fa-solid fa-camera" aria-hidden="true" /> Open Camera
          </button>
          <button
            type="button"
            className="btn chefseye-upload__btn chefseye-upload__btn--secondary"
            onClick={() => uploadInputRef.current?.click()}
            disabled={analyzing}
          >
            <i className="fa-solid fa-file-arrow-up" aria-hidden="true" /> Upload Photo
          </button>
        </div>

        {analyzing && (
          <p className="chefseye-upload__status">
            <i className="fa-solid fa-diamond" aria-hidden="true" /> AI is analyzing your food…
          </p>
        )}
      </div>

      {cameraOpen && (
        <div className="chefseye-camera-overlay" role="dialog" aria-modal="true" aria-label="Camera">
          <div className="chefseye-camera">
            <video
              ref={videoRef}
              className="chefseye-camera__video"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="chefseye-camera__canvas" aria-hidden="true" />
            <div className="chefseye-camera__actions">
              <button type="button" className="btn btn--secondary" onClick={stopCamera}>
                Cancel
              </button>
              <button type="button" className="btn" onClick={capturePhoto}>
                <i className="fa-solid fa-expand" aria-hidden="true" /> Take photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI recipe preview */}
      {recipe && (
        <div className="chefseye-result">
          <h2 className="chefseye-result__title">
            <i className="fa-solid fa-diamond" aria-hidden="true" /> AI Chef&apos;s Suggestion:{' '}
            {recipe.title || recipe.Title}
          </h2>
          <p><strong>Estimated Time:</strong> {recipe.time || recipe.Time}</p>
          
          <div className="chefseye-result__columns">
            
            <div style={{ flex: 1 }}>
              <h3>Ingredients</h3>
              <ul>
                {(recipe.ingredients || recipe.Ingredients || []).map((ing, idx) => (
                  <li key={idx}>
                    {ing.amount && <strong>{ing.amount} {ing.unit} </strong>}
                    {ing.name || ing}
                  </li>
                ))}
              </ul>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3>Cooking Steps</h3>
              <ol>
                {(recipe.steps || recipe.Steps || []).map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '10px' }}>{step}</li>
                ))}
              </ol>
            </div>

          </div>

          <TagInput
            value={tagInput}
            onChange={setTagInput}
            id="chefseye-tags"
            hint="Add tags so you can find this recipe in your library."
          />

          <button 
            className="btn" 
            onClick={handleSave} 
            disabled={saving}
            style={{ width: '100%', fontSize: '1.2rem', padding: '15px', marginTop: '20px' }}
          >
            {saving ? "Saving..." : (
              <>
                <i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save This Recipe to My Library
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** Bookmarkable /chefseye URL → Chef's Eye section inside Home. */
export function ChefsEyeRedirect() {
  return <Navigate to="/home?section=chefseye" replace />;
}