import { cookies, headers } from 'next/headers';
import { languages, defaultLanguage, getLocaleConfig, type AppLanguage } from './config';

export async function getLocale(): Promise<AppLanguage> {
  // Try to get locale from headers first (set by middleware)
  const headersList = await headers();
  const headerLocale = headersList.get('x-locale') as AppLanguage;
  
  if (headerLocale && languages.includes(headerLocale)) {
    return headerLocale;
  }

  // Fallback to cookie
  const cookieStore = await cookies();
  const cookieLocale = (cookieStore.get('NEXT_LOCALE')?.value ?? defaultLanguage) as AppLanguage;
  return languages.includes(cookieLocale) ? cookieLocale : defaultLanguage;
}

export async function getLocaleConfigServer() {
  const locale = await getLocale();
  return getLocaleConfig(locale);
}

export async function getDirection(): Promise<'ltr' | 'rtl'> {
  const locale = await getLocale();
  return getLocaleConfig(locale).dir;
}

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
      // Return a minimal set of translations to prevent crashes
      return {
        appTitle: "Multi-tenant Orders Dashboard",
        dashboard: "Dashboard",
        loading: "Loading...",
        error: "Error",
        success: "Success"
      };
    }
  }
}

// Date formatting utilities
export function formatDate(date: Date, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.DateTimeFormat(config.dateFormat, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.DateTimeFormat(config.dateFormat, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Number formatting utilities
export function formatNumber(num: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat).format(num);
}

export function formatCurrency(amount: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat, {
    style: 'currency',
    currency: config.currency,
  }).format(amount);
}

export function formatPercent(value: number, locale: AppLanguage): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(config.numberFormat, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
