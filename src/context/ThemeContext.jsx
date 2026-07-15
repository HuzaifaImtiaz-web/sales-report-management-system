import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  // mode: 'light' | 'dark' | 'system'
  const [mode, setMode] = useState(() => localStorage.getItem('app-theme-mode') || 'system');

  const resolveTheme = (m) => {
    if (m === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  };

  const [theme, setThemeState] = useState(() => resolveTheme(localStorage.getItem('app-theme-mode') || 'system'));

  useEffect(() => {
    const resolved = resolveTheme(mode);
    setThemeState(resolved);
    const root = window.document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme-mode', mode);
    localStorage.setItem('app-theme', resolved);
  }, [mode]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const root = window.document.documentElement;
      if (e.matches) { root.classList.add('dark'); setThemeState('dark'); }
      else { root.classList.remove('dark'); setThemeState('light'); }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (m) => setMode(m); // 'light' | 'dark' | 'system'

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
