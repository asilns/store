'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocale } from '@/lib/i18n/hooks';
import { locales, type AppLanguage } from '@/lib/i18n/config';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: AppLanguage) => {
    if (newLocale !== locale) {
      changeLocale(newLocale);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{locales[locale].flag}</span>
          <span className="hidden md:inline">{locales[locale].name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(locales).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as AppLanguage)}
            className={`cursor-pointer ${locale === code ? 'bg-accent' : ''}`}
          >
            <span className="mr-2">{config.flag}</span>
            <span>{config.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
