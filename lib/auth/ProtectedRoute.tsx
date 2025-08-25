"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useTranslations } from "@/lib/i18n/hooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    console.log('ProtectedRoute effect:', { user, loading, requireAdmin, isAdmin });
    
    if (loading) return;

    if (!user) {
      console.log('No user, redirecting to:', redirectTo);
      router.push(redirectTo as any);
      return;
    }

    // If admin is required, check if user has admin privileges
    if (requireAdmin && !isAdmin) {
      console.log('Admin required but user is not admin, redirecting to login');
      router.push("/login");
      return;
    }

    console.log('Access granted');
  }, [user, loading, requireAdmin, isAdmin, redirectTo, router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If admin is required, check if user has admin privileges
  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
