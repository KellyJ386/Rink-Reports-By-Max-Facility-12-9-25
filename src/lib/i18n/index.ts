/**
 * Internationalization (i18n) System
 *
 * Provides multi-language support for the MFO application.
 */

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

// Locale metadata
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const translations: Record<Locale, typeof en> = {
  en,
  es,
  fr,
};

/**
 * Get nested value from object by dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

/**
 * Interpolate variables in string
 * Replaces {{variable}} with actual values
 */
function interpolate(str: string, variables?: Record<string, string | number>): string {
  if (!variables) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

/**
 * Get translation for a key
 */
export function t(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  variables?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations[locale], key);

  if (typeof translation === 'string') {
    return interpolate(translation, variables);
  }

  // Fallback to default locale
  if (locale !== DEFAULT_LOCALE) {
    const fallback = getNestedValue(translations[DEFAULT_LOCALE], key);
    if (typeof fallback === 'string') {
      return interpolate(fallback, variables);
    }
  }

  // Return key if no translation found
  console.warn(`Missing translation for key: ${key}`);
  return key;
}

/**
 * Create a translator function for a specific locale
 */
export function createTranslator(locale: Locale) {
  return (key: string, variables?: Record<string, string | number>) =>
    t(key, locale, variables);
}

/**
 * Get all translations for a namespace
 */
export function getNamespace(
  namespace: string,
  locale: Locale = DEFAULT_LOCALE
): Record<string, unknown> | undefined {
  const ns = getNestedValue(translations[locale], namespace);
  return typeof ns === 'object' ? (ns as Record<string, unknown>) : undefined;
}

/**
 * Check if a locale is supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get locale from browser/header
 */
export function detectLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) {
    if (typeof window !== 'undefined') {
      acceptLanguage = navigator.language;
    } else {
      return DEFAULT_LOCALE;
    }
  }

  // Parse Accept-Language header
  const languages = acceptLanguage.split(',').map((lang) => {
    const [code, q = '1'] = lang.trim().split(';q=');
    return { code: code.split('-')[0].toLowerCase(), quality: parseFloat(q) };
  });

  // Sort by quality and find first supported locale
  languages.sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  return new Intl.NumberFormat(localeMap[locale], options).format(value);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  currency = 'USD'
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
  });
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(localeMap[locale], {
    dateStyle: 'medium',
    ...options,
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
  };

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  }
  if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  }
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
}

// Export types
export type TranslationKey = string;
export type Translator = (key: string, variables?: Record<string, string | number>) => string;
