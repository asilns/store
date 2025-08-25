import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Truck, 
  BarChart3, 
  CreditCard, 
  FileText,
  Settings 
} from "lucide-react";

export function StoreSidebar() {
  const { t } = useTranslations();
  const { direction } = useLocale();
  const pathname = usePathname();

  const nav: Array<{ href: any; label: string; icon: any }> = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/orders", label: t("orders"), icon: ShoppingCart },
    { href: "/products", label: t("products"), icon: Package },
    { href: "/shipments", label: t("shipments"), icon: Truck },
    { href: "/reports", label: t("reports"), icon: BarChart3 },
    { href: "/billing", label: t("billing"), icon: CreditCard },
    { href: "/invoices", label: t("invoices"), icon: FileText },
    { href: "/users", label: t("users"), icon: Users },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <ScrollArea className="h-screen">
      <nav className={`space-y-1 px-2 pt-6 pb-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}


