import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { kv } from '@/lib/kv';
import en from '@/i18n/en.json';
import hr from '@/i18n/hr.json';

/** hr = izvor istine (§10). Inicijalni jezik: spremljeni izbor → uređaj → hr. */
function initialLocale(): 'hr' | 'en' {
  const stored = kv.getString('locale');
  if (stored === 'hr' || stored === 'en') return stored;
  const deviceCode = getLocales()[0]?.languageCode ?? 'hr';
  return deviceCode === 'en' ? 'en' : 'hr';
}

// eslint-disable-next-line import/no-named-as-default-member
void i18n.use(initReactI18next).init({
  resources: {
    hr: { translation: hr },
    en: { translation: en },
  },
  lng: initialLocale(),
  fallbackLng: 'hr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
