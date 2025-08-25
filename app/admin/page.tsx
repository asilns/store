"use client";

import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";

function AdminPageContent() {
  const { t } = useTranslations();
  const { direction } = useLocale();

  return (
    <AppShell 
      sidebar={<AdminSidebar />} 
      title={t('admin.dashboard')}
    >
      <div className={`space-y-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.overview')}</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Add KPI cards here */}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('admin.storesTable')}</h2>
          </div>
          <div className="rounded-lg border">
            <div className="p-8 text-center text-muted-foreground">
              {t('admin.toBeFetched')}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminPageContent />
    </ProtectedRoute>
  );
}
