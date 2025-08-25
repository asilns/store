import { Button } from "@/components/ui/button";
import { Store, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";

interface NoStoreYetProps {
  className?: string;
}

export function NoStoreYet({ className = "" }: NoStoreYetProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const { locale } = useLocale();

  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${className}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-2" lang={locale}>
            {t("noStoreYet")}
          </h1>
          <p className="text-muted-foreground mb-6" lang={locale}>
            {t("createYourFirstStore")}
          </p>
        </div>
        <Button onClick={() => router.push('/settings')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Store
        </Button>
      </div>
    </div>
  );
}
