"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import supabase from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { useAuth } from "@/lib/auth/AuthContext";

// Zod schema for signup form validation
const baseSchema = z.object({
  name: z
    .string()
    .min(1, "nameRequired")
    .min(2, "nameMinLength")
    .max(100, "nameMaxLength"),
  email: z
    .string()
    .min(1, "emailRequired")
    .email("emailInvalid"),
  password: z
    .string()
    .min(1, "passwordRequired")
    .min(8, "passwordMinLength")
    .max(100, "passwordMaxLength")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "passwordPattern"
    ),
  confirmPassword: z
    .string()
    .min(1, "confirmPasswordRequired"),
});

const signupSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "passwordsMustMatch",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof SignupFormData, string>>;

export default function StoreSignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFormData, boolean>>>({});
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const { user, loading } = useAuth();

  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Validate a single field
  const validateField = (field: keyof SignupFormData, value: string) => {
    try {
      if (field === "name") {
        baseSchema.shape.name.parse(value);
      } else if (field === "email") {
        baseSchema.shape.email.parse(value);
      } else if (field === "password") {
        baseSchema.shape.password.parse(value);
      } else if (field === "confirmPassword") {
        baseSchema.shape.confirmPassword.parse(value);
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
  const handleFieldBlur = (field: keyof SignupFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    if (value) {
      let error = validateField(field, value);
      
      // Special validation for confirm password
      if (field === "confirmPassword" && !error && formData.password) {
        if (value !== formData.password) {
          error = "passwordsMustMatch";
        }
      }
      
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  // Handle field change
  const handleFieldChange = (field: keyof SignupFormData, value: string) => {
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



  // Helper function to get error message with i18n
  const getErrorMessage = (errorKey: string | undefined) => {
    if (!errorKey) return "";
    return t(`validation.${errorKey}`);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate entire form
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0] as keyof SignupFormData;
        if (path) {
          newErrors[path] = error.message;
        }
      });
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Sign up directly with Supabase client
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw new Error(signUpError.message || 'Signup failed');
      }

      if (signUpData.user) {
        // Insert user data into the users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email: formData.email,
            name: formData.name,
            role: null, // Regular store users have no special role
          });

        if (insertError) {
          console.error('Failed to insert user into users table:', insertError);
          // Clean up the auth user if database insert fails
          await supabase.auth.signOut();
          throw new Error('Failed to create user profile');
        }

        // Sign in with Supabase client to establish the session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          // If sign in fails, redirect to login
          router.push("/login");
          toast.success(t("accountCreatedPleaseLogin"));
          return;
        }

        if (signInData.session) {
          router.push("/dashboard");
          toast.success(t("accountCreated"));
        } else {
          // If no session, redirect to login
          router.push("/login");
          toast.success(t("accountCreatedPleaseLogin"));
        }
      }
    } catch (err: any) {
      const message = err?.message ?? t("somethingWentWrong");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Don't render the signup form if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.redirectingToDashboard")}</p>
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
            <h1 className="text-3xl font-bold" lang={locale}>{t("createStoreAccountTitle")}</h1>
            <p className="text-muted-foreground mt-2" lang={locale}>{t("getStartedWithStore")}</p>
          </div>
          <Card>
            <CardHeader className={`text-center ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <CardTitle lang={locale}>{t("signup")}</CardTitle>
              <CardDescription lang={locale}>
                {t("createStoreAccountDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" lang={locale}>{t("name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("enterName")}
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    className={errors.name ? "border-destructive" : ""}
                    dir={direction}
                  />
                  {errors.name && touched.name && (
                    <p className="text-sm text-destructive" lang={locale}>
                      {getErrorMessage(errors.name)}
                    </p>
                  )}
                </div>
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
                    placeholder={t("createPassword")}
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
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" lang={locale}>{t("confirmPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t("confirmYourPassword")}
                    value={formData.confirmPassword}
                    onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                    dir={direction}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-sm text-destructive" lang={locale}>
                      {getErrorMessage(errors.confirmPassword)}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("creatingAccount") : t("createAccount")}
                </Button>
              </form>

              <div className={`mt-6 text-center space-y-2 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-muted-foreground" lang={locale}>
                  {t("alreadyHaveAccount")}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => router.push("/login")}
                  >
                    {t("signInHere")}
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