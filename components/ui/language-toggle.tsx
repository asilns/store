'use client';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/hooks';
import { locales, type AppLanguage } from '@/lib/i18n/config';

export function LanguageToggle() {
  const { locale, changeLocale } = useLocale();

  // Get the opposite language
  const oppositeLocale = locale === 'en' ? 'ar' : 'en';
  const oppositeConfig = locales[oppositeLocale];

  const handleToggle = () => {
    changeLocale(oppositeLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="gap-2 px-3"
      title={`Switch to ${oppositeConfig.name}`}
    >
      <span className="text-sm">{oppositeConfig.flag}</span>
      <span className="hidden sm:inline text-xs">{oppositeConfig.name}</span>
    </Button>
  );
}
