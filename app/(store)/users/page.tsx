"use client";

import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "@/lib/i18n/hooks";
import { useStore } from "@/lib/hooks/useStore";
import { UserManagementTable } from "@/components/store/user-management/UserManagementTable";
import { StoreLoadingWrapper } from "@/components/store/StoreLoadingWrapper";

function UsersPageContent() {
  const { t } = useTranslations();
  
  return (
    <StoreLoadingWrapper>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('userManagement.title')}</h1>
          <p className="text-muted-foreground">{t('userManagement.description')}</p>
        </div>

        <UserManagementTable />
      </div>
    </StoreLoadingWrapper>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <UsersPageContent />
    </ProtectedRoute>
  );
}
