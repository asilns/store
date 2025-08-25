export const languages = ['en', 'ar'] as const;
export type AppLanguage = (typeof languages)[number];

export const defaultLanguage: AppLanguage = 'en';

export const isRTL = (lng: AppLanguage) => lng === 'ar';

export const locales = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    dateFormat: 'en-US',
    numberFormat: 'en-US',
    currency: 'USD'
  },
  ar: {
    name: 'العربية',
    flag: '🇶🇦',
    dir: 'rtl',
    dateFormat: 'ar-QA',
    numberFormat: 'ar-QA',
    currency: 'QAR'
  }
} as const;

export const getLocaleConfig = (locale: AppLanguage) => locales[locale];

// Next.js i18n configuration
export const i18nConfig = {
  defaultLocale: defaultLanguage,
  locales: languages,
  localeDetection: true,
} as const;


