/** PanKo — Light/dark theme persisted in localStorage. */
const THEME_KEY = 'allen-voice-theme';

export function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(THEME_KEY, resolved);
  return resolved;
}

export function toggleTheme() {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
}
