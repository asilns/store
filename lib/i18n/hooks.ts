'use client';

import { useState, useEffect } from 'react';
import { languages, defaultLanguage, getLocaleConfig, type AppLanguage } from './config';

export function useLocale() {
  const [locale, setLocale] = useState<AppLanguage>(defaultLanguage);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    // Get locale from cookie on client side
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as AppLanguage;
    
    const currentLocale = languages.includes(cookieLocale) ? cookieLocale : defaultLanguage;
    setLocale(currentLocale);
    setDirection(getLocaleConfig(currentLocale).dir);
  }, []);

  const changeLocale = (newLocale: AppLanguage) => {
    if (languages.includes(newLocale)) {
      setLocale(newLocale);
      setDirection(getLocaleConfig(newLocale).dir);
      
      // Update cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      
      // Update HTML attributes
      document.documentElement.lang = newLocale;
      document.documentElement.dir = getLocaleConfig(newLocale).dir;
      
      // Reload page to apply changes
      window.location.reload();
    }
  };

  return { locale, direction, changeLocale };
}

export function useTranslations() {
  const { locale } = useLocale();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadTranslations() {
      if (!isMounted) return;
      
      try {
        const response = await fetch(`/locales/${locale}/common.json`);
        
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setTranslations(data);
            setError(null);
          }
        } else {
          console.warn(`Failed to load translations for ${locale}, status: ${response.status}`);
          // Fallback to default language
          const fallbackResponse = await fetch(`/locales/${defaultLanguage}/common.json`);
          if (fallbackResponse.ok && isMounted) {
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
            setError(`Failed to load ${locale} translations, using ${defaultLanguage}`);
          } else if (isMounted) {
            setError(`Failed to load both ${locale} and ${defaultLanguage} translations`);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load translations:', error);
          setError(`Network error: ${error}`);
          // Fallback to default language
          try {
            const fallbackResponse = await fetch(`/locales/${defaultLanguage}/common.json`);
            if (fallbackResponse.ok && isMounted) {
              const fallbackData = await fallbackResponse.json();
              setTranslations(fallbackData);
            }
                  } catch (fallbackError) {
          if (isMounted) {
            console.error('Failed to load fallback translations:', fallbackError);
            setError(`Failed to load any translations: ${fallbackError}`);
            // Set minimal translations to prevent crashes
            setTranslations({
              appTitle: "Multi-tenant Orders Dashboard",
              dashboard: "Dashboard",
              loading: "Loading...",
              error: "Error",
              success: "Success"
            });
          }
        }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTranslations();
    
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const t = (key: string): string => {
    // If translations are not loaded yet, return the key to prevent infinite loops
    if (loading || Object.keys(translations).length === 0) {
      return key;
    }
    
    // Handle nested keys like 'admin.routes.dashboard'
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Only log warning once per key to avoid infinite repetition
        if (!(translations as any)._warnedKeys) {
          (translations as any)._warnedKeys = new Set();
        }
        if (!(translations as any)._warnedKeys.has(key)) {
          console.warn(`Translation key not found: ${key}`);
          (translations as any)._warnedKeys.add(key);
        }
        return key; // Return the key if not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const tWithFallback = (key: string, fallback: string): string => {
    return translations[key] || fallback;
  };

  return { t, tWithFallback, loading, locale, error };
}

// Client-side formatting utilities
export function formatDateClient(date: Date, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.DateTimeFormat(config.dateFormat, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTimeClient(date: Date, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.DateTimeFormat(config.dateFormat, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatNumberClient(num: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat).format(num);
}

export function formatCurrencyClient(amount: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

export function formatPercentClient(value: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
