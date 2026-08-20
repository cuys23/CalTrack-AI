import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { vi } from './vi';

export type Locale = 'en' | 'vi';

const LOCALE_KEY = 'caltrack_locale';

const translations: Record<Locale, typeof en> = { en, vi };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Resolve a dot-separated key against a nested translation object.
 *
 * `get(en, 'home.breakfast')` → `'Breakfast'`
 */
function get(obj: any, path: string): string | string[] | undefined {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'vi') setLocaleState(saved);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(LOCALE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = get(translations[locale], key) ?? get(translations.en, key) ?? key;

      // Arrays (like paywall.features) return joined — callers needing the
      // array should use tArray() instead.
      if (Array.isArray(value)) return value.join(', ');

      let result = String(value);

      // Interpolate {{param}} placeholders.
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });
      }

      return result;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};

/**
 * Return an array value from translations, e.g. paywall feature list.
 */
export const useTArray = () => {
  const { locale } = useTranslation();

  return useCallback(
    (key: string): string[] => {
      const value = get(translations[locale], key) ?? get(translations.en, key);
      return Array.isArray(value) ? value : [String(value ?? key)];
    },
    [locale]
  );
};
