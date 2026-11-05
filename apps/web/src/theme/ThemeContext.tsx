import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme } from '@fluentui/react-components';
import { bccLightTheme, bccDarkTheme, bccHighContrastTheme } from './brand';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedThemeName: 'light' | 'dark' | 'high-contrast';
  fluentTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('bcc_theme') as ThemeMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'high-contrast' || saved === 'system'
      ? saved
      : 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('bcc_theme', mode);
  }, []);

  const resolvedThemeName: 'light' | 'dark' | 'high-contrast' =
    themeMode === 'system'
      ? (systemIsDark ? 'dark' : 'light')
      : themeMode;

  const fluentTheme =
    resolvedThemeName === 'high-contrast'
      ? bccHighContrastTheme
      : resolvedThemeName === 'dark'
      ? bccDarkTheme
      : bccLightTheme;

  useEffect(() => {
    const bg = fluentTheme.colorNeutralBackground3;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.documentElement.style.colorScheme =
      resolvedThemeName === 'dark' ? 'dark' : resolvedThemeName === 'high-contrast' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolvedThemeName);
  }, [resolvedThemeName, fluentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        resolvedThemeName,
        fluentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
