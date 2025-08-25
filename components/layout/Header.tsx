"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLocale, useTranslations } from "@/lib/i18n/hooks";

export function Header() {
  const router = useRouter();
  const { direction } = useLocale();
  const { t } = useTranslations();
  
  return (
    <header className="border-b">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            {t("common.appName")}
          </button>
          <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
