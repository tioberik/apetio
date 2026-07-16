import { colorScheme as nativewindColorScheme } from 'nativewind';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { type ThemeMode, useThemeMode } from '@/features/settings/store';
import { type ThemeColors, type ThemeName, themes } from '@/theme/colors';

interface ThemeContextValue {
  name: ThemeName;
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useThemeMode();

  const name: ThemeName = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  // Keep NativeWind's `dark:` variant in sync with the resolved mode.
  useEffect(() => {
    nativewindColorScheme.set(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ name, colors: themes[name], mode, setMode }),
    [name, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
