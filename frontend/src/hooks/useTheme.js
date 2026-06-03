/** PanKo — Theme state synced to document data-theme. */
import { useState, useEffect, useCallback } from 'react';
import { applyTheme, getStoredTheme, toggleTheme as toggleStoredTheme } from '../utils/theme';

export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(toggleStoredTheme());
  }, []);

  return { theme, toggleTheme };
}
