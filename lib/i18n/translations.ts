import { getLocale } from './server';
import { defaultLanguage } from './config';

export async function getTranslations() {
  const locale = await getLocale();
  
  try {
    // Dynamic import of translation files
    const translations = await import(`../../public/locales/${locale}/common.json`);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for locale: ${locale}, falling back to ${defaultLanguage}`);
    
    // Fallback to default language
    try {
      const fallbackTranslations = await import(`../../public/locales/${defaultLanguage}/common.json`);
      return fallbackTranslations.default;
    } catch (fallbackError) {
      console.error('Failed to load fallback translations:', fallbackError);
      return {};
    }
  }
}

export async function t(key: string): Promise<string> {
  const translations = await getTranslations();
  return translations[key] || key;
}

export async function tWithFallback(key: string, fallback: string): Promise<string> {
  const translations = await getTranslations();
  return translations[key] || fallback;
}

// Type-safe translation keys
export type TranslationKey = keyof typeof import('../../public/locales/en/common.json');
