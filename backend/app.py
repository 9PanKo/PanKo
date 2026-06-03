"""PanKo Flask API — Chef's Eye vision (Gemini) and unit conversion."""

import base64
import json
import os

import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# --- Config ---
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

app = Flask(__name__)
CORS(app)

# Prompt: Gemini must return JSON only (title, time, ingredients, steps, tags).
VISION_PROMPT = """
Look at the ingredients in this image. Create a delicious, highly structured recipe using primarily these items.
You MUST return ONLY a JSON object with this exact structure:
{
  "title": "Recipe Name",
  "time": "XX mins",
  "ingredients": [
    {"amount": 1, "unit": "cup", "name": "ingredient name"}
  ],
  "steps": [
    "Step 1 instruction.",
    "Step 2 instruction."
  ],
  "tags": ["dinner", "quick", "chicken"]
}
Include 3 to 6 short lowercase tags describing meal type, cuisine, diet, or main ingredients.
"""

DEFAULT_GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-8b',
]

# Supported cooking unit pairs (from_unit → to_unit keys).
UNIT_CONVERSIONS = {
    'ml_to_l': lambda amount: amount / 1000,
    'l_to_ml': lambda amount: amount * 1000,
    'g_to_kg': lambda amount: amount / 1000,
    'kg_to_g': lambda amount: amount * 1000,
    'tsp_to_tbsp': lambda amount: amount / 3,
    'tbsp_to_tsp': lambda amount: amount * 3,
}


def _error(message, status=400):
    """JSON error payload."""
    return jsonify({'status': 'error', 'message': message}), status


def _gemini_models_to_try():
    """Prefer GEMINI_MODEL from .env, then fall back list."""
    preferred = os.getenv('GEMINI_MODEL', '').strip()
    models = [preferred] if preferred else []
    for name in DEFAULT_GEMINI_MODELS:
        if name not in models:
            models.append(name)
    return models


def _detect_image_mime(image_bytes):
    """Sniff PNG/JPEG/GIF/WebP from magic bytes."""
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image/png'
    if image_bytes[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if image_bytes[:6] in (b'GIF87a', b'GIF89a'):
        return 'image/gif'
    if image_bytes[:4] == b'RIFF' and image_bytes[8:12] == b'WEBP':
        return 'image/webp'
    return 'image/jpeg'


def _generate_recipe_from_image(image_base64):
    """Call Gemini vision; try models in order until one succeeds."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError(
            'GEMINI_API_KEY is missing. Add a key from https://aistudio.google.com/apikey to backend/.env'
        )

    genai.configure(api_key=api_key)
    image_bytes = base64.b64decode(image_base64)
    mime_type = _detect_image_mime(image_bytes)
    generation_config = genai.GenerationConfig(response_mime_type='application/json')
    content_parts = [VISION_PROMPT, {'mime_type': mime_type, 'data': image_bytes}]

    errors = []
    for model_name in _gemini_models_to_try():
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                content_parts,
                generation_config=generation_config,
            )
            return json.loads(response.text)
        except Exception as exc:
            errors.append(f'{model_name}: {exc}')

    raise RuntimeError(
        'No Gemini vision model available. Tried: '
        + '; '.join(errors)
        + '. Set GEMINI_MODEL in .env to a model from https://ai.google.dev/gemini-api/docs/models'
    )


# --- Routes ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'panko-api'}), 200


@app.route('/api/vision-recipe', methods=['POST'])
def generate_vision_recipe():
    """POST { image: base64 } → structured recipe JSON."""
    image_base64 = (request.json or {}).get('image')
    if not image_base64:
        return _error('No image provided')

    try:
        recipe = _generate_recipe_from_image(image_base64)
        return jsonify({'status': 'success', 'recipe': recipe})
    except json.JSONDecodeError:
        return _error('AI returned invalid JSON. Please try another photo.')
    except Exception as exc:
        return _error(str(exc), 500)


@app.route('/api/convert', methods=['POST'])
def convert_units():
    """POST { amount, from_unit, to_unit } → human-readable result."""
    data = request.json or {}
    try:
        amount = float(data.get('amount'))
        from_unit = str(data.get('from_unit', '')).lower().strip()
        to_unit = str(data.get('to_unit', '')).lower().strip()
    except (TypeError, ValueError):
        return _error('Invalid amount or parameters provided.')

    convert = UNIT_CONVERSIONS.get(f'{from_unit}_to_{to_unit}')
    if not convert:
        return _error('Conversion unit combination not supported yet.')

    converted = convert(amount)
    return jsonify({
        'status': 'success',
        'result': f'{amount} {from_unit} is equal to {converted:.2f} {to_unit}',
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
