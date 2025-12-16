'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  detectLocale,
  isValidLocale,
  type Locale,
} from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  supportedLocales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'mfo-locale';

interface LocaleProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function LocaleProvider({
  children,
  defaultLocale = DEFAULT_LOCALE,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from storage or browser preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check localStorage first
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && isValidLocale(storedLocale)) {
      setLocaleState(storedLocale);
    } else {
      // Detect from browser
      const detected = detectLocale();
      setLocaleState(detected);
    }

    setIsInitialized(true);
  }, []);

  // Update locale and persist to storage
  const setLocale = useCallback((newLocale: Locale) => {
    if (!isValidLocale(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}`);
      return;
    }

    setLocaleState(newLocale);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

      // Update document lang attribute
      document.documentElement.lang = newLocale;
    }
  }, []);

  // Set document lang on initial load and locale change
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      document.documentElement.lang = locale;
    }
  }, [locale, isInitialized]);

  const value: LocaleContextValue = {
    locale,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
    localeNames: LOCALE_NAMES,
  };

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

/**
 * Language selector component
 */
export function LanguageSelector({
  className,
}: {
  className?: string;
}) {
  const { locale, setLocale, supportedLocales, localeNames } = useLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={className}
      aria-label="Select language"
    >
      {supportedLocales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}

export default LocaleProvider;
