import { ReactNode } from "react";
import { useStore } from "@/lib/hooks/useStore";
import { NoStoreYet } from "./NoStoreYet";
import { Store } from "lucide-react";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";

interface StoreLoadingWrapperProps {
  children: ReactNode;
  showNoStore?: boolean;
  className?: string;
}

export function StoreLoadingWrapper({ 
  children, 
  showNoStore = true,
  className = "" 
}: StoreLoadingWrapperProps) {
  const { currentStore, loading, error } = useStore();
  const { t } = useTranslations();
  const { locale } = useLocale();

  // Show loading state while fetching store data
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground" lang={locale}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Show error state if there was an error fetching stores
  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2" lang={locale}>
              Error Loading Store
            </h1>
            <p className="text-muted-foreground mb-6" lang={locale}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show no store state if no store exists and showNoStore is true
  if (!currentStore && showNoStore) {
    return <NoStoreYet className={className} />;
  }

  // If no store and we don't want to show no store state, return null
  if (!currentStore && !showNoStore) {
    return null;
  }

  // Show children if we have a store
  return <>{children}</>;
}
