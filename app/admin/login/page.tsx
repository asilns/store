"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import supabase from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

// Zod schema for admin login form validation
const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, "adminEmailRequired")
    .email("adminEmailInvalid"),
  password: z
    .string()
    .min(1, "adminPasswordRequired"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type FormErrors = Partial<Record<keyof AdminLoginFormData, string>>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AdminLoginFormData, boolean>>>({});
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const { user, isAdmin, loading } = useAuth();

  // TODO: Delete after development
  const [formData, setFormData] = useState<AdminLoginFormData>({
    email: "fedir.kopakov@gmail.com",
    password: "AdminFedir2025!StrongPass",
  });

  // Redirect if user is already logged in as admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [user, isAdmin, loading, router]);

  // Validate a single field
  const validateField = (field: keyof AdminLoginFormData, value: string) => {
    try {
      if (field === "email") {
        adminLoginSchema.shape.email.parse(value);
      } else if (field === "password") {
        adminLoginSchema.shape.password.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null;
      }
      return null;
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (field: keyof AdminLoginFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    if (value) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  // Handle field change
  const handleFieldChange = (field: keyof AdminLoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    // Validate entire form
    const result = adminLoginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0] as keyof AdminLoginFormData;
        if (path) {
          newErrors[path] = error.message;
        }
      });
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
  
    try {
      // Call the server-side API endpoint
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success) {
        console.log('API login successful, attempting to sign in with Supabase...');
        
        // Sign in with Supabase client to properly establish the session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          throw new Error('Failed to establish session');
        }

        if (signInData.session) {
          console.log('Supabase sign in successful, session established');
          toast.success(t("signedInSuccessfully"));
          // Redirect immediately
          console.log('Redirecting to /admin...');
          router.replace("/admin");
          return;
        }

        throw new Error('Failed to establish session');
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get error message with i18n
  const getErrorMessage = (errorKey: string | undefined) => {
    if (!errorKey) return "";
    return t(`validation.${errorKey}`);
  };

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the login form if user is already logged in as admin
  if (user && isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center p-4 flex-1">
        <div className="w-full max-w-md">
          <div className={`text-center mb-8 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h1 className="text-3xl font-bold" lang={locale}>{t("adminLogin")}</h1>
            <p className="text-muted-foreground mt-2" lang={locale}>{t("enterAdminCredentials")}</p>
          </div>
          
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" lang={locale}>{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("enterEmail")}
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    className={errors.email ? "border-destructive" : ""}
                    dir={direction}
                  />
                  {errors.email && touched.email && (
                    <p className="text-sm text-destructive" lang={locale}>
                      {getErrorMessage(errors.email)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" lang={locale}>{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("enterPassword")}
                    value={formData.password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    onBlur={() => handleFieldBlur("password")}
                    className={errors.password ? "border-destructive" : ""}
                    dir={direction}
                  />
                  {errors.password && touched.password && (
                    <p className="text-sm text-destructive" lang={locale}>
                      {getErrorMessage(errors.password)}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("signingIn") : t("signInAsAdmin")}
                </Button>
              </form>
              
              <div className={`mt-6 text-center ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-muted-foreground" lang={locale}>
                  {t("storeTeam")}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => router.push("/login")}
                  >
                    {t("signInHereLink")}
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}