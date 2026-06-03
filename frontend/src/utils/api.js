/** PanKo — Flask API client (Chef's Eye vision, unit conversion). */
const DEFAULT_API_BASE = 'http://127.0.0.1:5000';

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  return fromEnv || DEFAULT_API_BASE;
}

export async function apiPost(path, body) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}
