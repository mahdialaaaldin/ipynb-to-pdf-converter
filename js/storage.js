/**
 * storage.js
 * Thin wrapper around localStorage for theme preference.
 * Falls back silently if localStorage is unavailable (privacy mode, restricted browsers).
 */
const ThemeStorage = (() => {
  const KEY = 'notetopdf:theme';

  function get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  function set(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore — theme just won't persist this session */
    }
  }

  function getPreferredTheme() {
    const saved = get();
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  return { get, set, getPreferredTheme };
})();
