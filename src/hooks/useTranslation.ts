'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from '@/components/providers/LocaleProvider';
import {
  t as translate,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  type Locale,
} from '@/lib/i18n';

/**
 * Hook for accessing translations and formatting utilities
 *
 * @example
 * const { t, formatNumber, formatDate, locale, setLocale } = useTranslation();
 *
 * return (
 *   <div>
 *     <h1>{t('dashboard.title')}</h1>
 *     <p>{t('dashboard.welcome', { name: 'John' })}</p>
 *     <span>{formatNumber(1234.56)}</span>
 *     <span>{formatDate(new Date())}</span>
 *   </div>
 * );
 */
export function useTranslation() {
  const { locale, setLocale } = useLocale();

  // Translation function
  const t = useCallback(
    (key: string, variables?: Record<string, string | number>) => {
      return translate(key, locale, variables);
    },
    [locale]
  );

  // Number formatting
  const formatNum = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(value, locale, options);
    },
    [locale]
  );

  // Currency formatting
  const formatCurr = useCallback(
    (value: number, currency?: string) => {
      return formatCurrency(value, locale, currency);
    },
    [locale]
  );

  // Date formatting
  const formatDateFn = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, locale, options);
    },
    [locale]
  );

  // Relative time formatting
  const formatRelative = useCallback(
    (date: Date | string) => {
      return formatRelativeTime(date, locale);
    },
    [locale]
  );

  return useMemo(
    () => ({
      t,
      locale,
      setLocale,
      formatNumber: formatNum,
      formatCurrency: formatCurr,
      formatDate: formatDateFn,
      formatRelativeTime: formatRelative,
    }),
    [t, locale, setLocale, formatNum, formatCurr, formatDateFn, formatRelative]
  );
}

/**
 * Hook for getting a namespaced translation function
 *
 * @example
 * const t = useTranslationNamespace('incidents');
 * return <h1>{t('title')}</h1>; // translates 'incidents.title'
 */
export function useTranslationNamespace(namespace: string) {
  const { t: translate, ...rest } = useTranslation();

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>) => {
      return translate(`${namespace}.${key}`, variables);
    },
    [translate, namespace]
  );

  return { t, ...rest };
}

export default useTranslation;
