import i18n from '@/i18n';
import { kv, useKVString } from '@/lib/kv';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppLocale = 'hr' | 'en';

const KEY_THEME_MODE = 'themeMode';
const KEY_LOCALE = 'locale';

// --- Theme mode ---------------------------------------------------------------

export function getThemeMode(): ThemeMode {
  const v = kv.getString(KEY_THEME_MODE);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export function setThemeMode(mode: ThemeMode): void {
  kv.set(KEY_THEME_MODE, mode);
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const raw = useKVString(KEY_THEME_MODE);
  const mode: ThemeMode = raw === 'light' || raw === 'dark' ? raw : 'system';
  return [mode, setThemeMode];
}

// --- Locale -------------------------------------------------------------------

export function setLocale(locale: AppLocale): void {
  kv.set(KEY_LOCALE, locale);
  void i18n.changeLanguage(locale);
}

export function useLocale(): [AppLocale, (locale: AppLocale) => void] {
  const raw = useKVString(KEY_LOCALE);
  const locale: AppLocale = raw === 'en' ? 'en' : 'hr';
  return [locale, setLocale];
}
