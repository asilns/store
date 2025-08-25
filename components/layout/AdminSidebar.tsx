'use client';

import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { LayoutDashboard, Store, CreditCard, Receipt, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { t } = useTranslations();
  const { direction } = useLocale();
  const pathname = usePathname();

  return (
    <ScrollArea className="h-screen">
      <nav className="space-y-2 pt-3">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          {t('admin.routes.dashboard')}
        </Link>
        <Link
          href="/admin/stores"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/stores" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Store className="h-4 w-4" />
          {t('admin.routes.stores')}
        </Link>
        <Link
          href="/admin/subscriptions"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/subscriptions" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <CreditCard className="h-4 w-4" />
          {t('admin.routes.subscriptions')}
        </Link>
        <Link
          href="/admin/invoices"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/invoices" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Receipt className="h-4 w-4" />
          {t('admin.routes.invoices')}
        </Link>
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/settings" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Settings className="h-4 w-4" />
          {t('admin.routes.settings')}
        </Link>
      </nav>
    </ScrollArea>
  );
}


