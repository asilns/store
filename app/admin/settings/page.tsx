"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Globe, Bell, Database, Key, Users, Store, CreditCard, AlertTriangle, CheckCircle, Save, RefreshCw, Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { z } from "zod";

// Zod schemas for validation
const generalSettingsSchema = z.object({
  platformName: z.string().min(1, "Platform name is required"),
  supportEmail: z.string().email("Invalid email address"),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  currency: z.enum(["USD", "QAR", "EUR"]),
  language: z.enum(["en", "ar"]),
});

const securitySettingsSchema = z.object({
  sessionTimeout: z.number().min(15, "Session timeout must be at least 15 minutes"),
  maxLoginAttempts: z.number().min(3, "Max login attempts must be at least 3"),
  passwordMinLength: z.number().min(8, "Password minimum length must be at least 8"),
  requireTwoFactor: z.boolean(),
  enableAuditLog: z.boolean(),
  ipWhitelist: z.string().optional(),
});

const billingSettingsSchema = z.object({
  defaultCurrency: z.enum(["USD", "QAR", "EUR"]),
  taxRate: z.number().min(0, "Tax rate must be non-negative"),
  gracePeriod: z.number().min(0, "Grace period must be non-negative"),
  autoSuspend: z.boolean(),
  sendReminders: z.boolean(),
  reminderDays: z.number().min(1, "Reminder days must be at least 1"),
});

function AdminSettingsPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [generalSettings, setGeneralSettings] = useState<{
    platformName: string;
    supportEmail: string;
    timezone: string;
    dateFormat: string;
    currency: "USD" | "QAR" | "EUR";
    language: "en" | "ar";
  }>({
    platformName: "Multi-tenant Orders Dashboard",
    supportEmail: "support@example.com",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    language: "en",
  });
  
  const [securitySettings, setSecuritySettings] = useState<{
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    enableAuditLog: boolean;
    ipWhitelist: string;
  }>({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    enableAuditLog: true,
    ipWhitelist: "",
  });
  
  const [billingSettings, setBillingSettings] = useState<{
    defaultCurrency: "USD" | "QAR" | "EUR";
    taxRate: number;
    gracePeriod: number;
    autoSuspend: boolean;
    sendReminders: boolean;
    reminderDays: number;
  }>({
    defaultCurrency: "USD",
    taxRate: 0,
    gracePeriod: 7,
    autoSuspend: true,
    sendReminders: true,
    reminderDays: 3,
  });
  
  const [formErrors, setFormErrors] = useState<{
    general?: Record<string, string>;
    security?: Record<string, string>;
    billing?: Record<string, string>;
  }>({});

  // Mock data - in real app this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const timezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Qatar", label: "Qatar (AST)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  ];

  const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (EU)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
    { value: "DD.MM.YYYY", label: "DD.MM.YYYY (DE)" },
  ];

  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "QAR", label: "Qatar Riyal (ر.ق)" },
    { value: "EUR", label: "Euro (€)" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
  ];

  const validateGeneralSettings = () => {
    try {
      generalSettingsSchema.parse(generalSettings);
      setFormErrors(prev => ({ ...prev, general: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(prev => ({ ...prev, general: errors }));
      }
      return false;
    }
  };

  const validateSecuritySettings = () => {
    try {
      securitySettingsSchema.parse(securitySettings);
      setFormErrors(prev => ({ ...prev, security: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(prev => ({ ...prev, security: errors }));
      }
      return false;
    }
  };

  const validateBillingSettings = () => {
    try {
      billingSettingsSchema.parse(billingSettings);
      setFormErrors(prev => ({ ...prev, billing: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(prev => ({ ...prev, billing: errors }));
      }
      return false;
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!validateGeneralSettings()) return;
    
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("General settings saved successfully");
      setSaving(false);
    }, 1000);
  };

  const handleSaveSecuritySettings = async () => {
    if (!validateSecuritySettings()) return;
    
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Security settings saved successfully");
      setSaving(false);
    }, 1000);
  };

  const handleSaveBillingSettings = async () => {
    if (!validateBillingSettings()) return;
    
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Billing settings saved successfully");
      setSaving(false);
    }, 1000);
  };

  const handleExportSettings = () => {
    try {
      // Create CSV content for settings
      const settingsData = [
        ['Setting Category', 'Setting Name', 'Value'],
        ['General', 'Platform Name', generalSettings.platformName],
        ['General', 'Support Email', generalSettings.supportEmail],
        ['General', 'Timezone', generalSettings.timezone],
        ['General', 'Date Format', generalSettings.dateFormat],
        ['General', 'Currency', generalSettings.currency],
        ['General', 'Language', generalSettings.language],
        ['Security', 'Session Timeout', securitySettings.sessionTimeout],
        ['Security', 'Max Login Attempts', securitySettings.maxLoginAttempts],
        ['Security', 'Password Min Length', securitySettings.passwordMinLength],
        ['Security', 'Require Two Factor', securitySettings.requireTwoFactor],
        ['Security', 'Enable Audit Log', securitySettings.enableAuditLog],
        ['Billing', 'Default Currency', billingSettings.defaultCurrency],
        ['Billing', 'Tax Rate', billingSettings.taxRate],
        ['Billing', 'Grace Period', billingSettings.gracePeriod]
      ];

      const csvContent = settingsData.map(row => row.join(',')).join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin-settings-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Settings exported successfully");
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error("Failed to export settings");
    }
  };

  const handleImportSettings = () => {
    // In real app, implement settings import
    toast.info("Import functionality coming soon");
  };

  const handleResetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      // Reset to default values
      setGeneralSettings({
        platformName: "Multi-tenant Orders Dashboard",
        supportEmail: "support@example.com",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        currency: "USD",
        language: "en",
      });
      setSecuritySettings({
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireTwoFactor: false,
        enableAuditLog: true,
        ipWhitelist: "",
      });
      setBillingSettings({
        defaultCurrency: "USD",
        taxRate: 0,
        gracePeriod: 7,
        autoSuspend: true,
        sendReminders: true,
        reminderDays: 3,
      });
      toast.success("Settings reset to defaults");
    }
  };

  const handleRefreshSettings = async () => {
    // In real app, this would refresh settings from the server
    toast.info("Refreshing settings...");
    setTimeout(() => {
      toast.success("Settings refreshed successfully");
    }, 1000);
  };

  if (loading) {
    return (
      <AppShell sidebar={<AdminSidebar />} title={t("admin.settings.title")}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell sidebar={<AdminSidebar />} title={t("admin.settings.title")}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.settings.title")}</h1>
            <p className="text-muted-foreground">{t("admin.settings.description")}</p>
          </div>
          <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={handleRefreshSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("refresh")}
            </Button>
            <Button variant="outline" onClick={handleImportSettings}>
              <Upload className="h-4 w-4 mr-2" />
              {t("import")}
            </Button>
            <Button variant="outline" onClick={handleExportSettings}>
              <Download className="h-4 w-4 mr-2" />
              {t("export")}
            </Button>
            <Button variant="outline" onClick={handleResetToDefaults}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t("resetToDefaults")}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("admin.settings.general")}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("admin.settings.security")}
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("admin.settings.billing")}
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("system")}
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t("platformConfiguration")}
                </CardTitle>
                <CardDescription>
                  {t("platformConfigurationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">{t("platformName")}</Label>
                    <Input
                      id="platformName"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformName: e.target.value }))}
                      className={formErrors.general?.platformName ? "border-red-500" : ""}
                    />
                    {formErrors.general?.platformName && (
                      <p className="text-sm text-red-500">{formErrors.general.platformName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className={formErrors.general?.supportEmail ? "border-red-500" : ""}
                    />
                    {formErrors.general?.supportEmail && (
                      <p className="text-sm text-red-500">{formErrors.general.supportEmail}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t("timezone")}</Label>
                    <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.general?.timezone && (
                      <p className="text-sm text-red-500">{formErrors.general.timezone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
                    <Select value={generalSettings.dateFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.general?.dateFormat && (
                      <p className="text-sm text-red-500">{formErrors.general.dateFormat}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t("defaultCurrency")}</Label>
                    <Select value={generalSettings.currency} onValueChange={(value: "USD" | "QAR" | "EUR") => setGeneralSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t("defaultLanguage")}</Label>
                  <Select value={generalSettings.language} onValueChange={(value: "en" | "ar") => setGeneralSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? t("saving") : t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("securityConfiguration")}
                </CardTitle>
                <CardDescription>
                  {t("securityConfigurationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">{t("sessionTimeout")} (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="15"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                      className={formErrors.security?.sessionTimeout ? "border-red-500" : ""}
                    />
                    {formErrors.security?.sessionTimeout && (
                      <p className="text-sm text-red-500">{formErrors.security.sessionTimeout}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">{t("maxLoginAttempts")}</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                      className={formErrors.security?.maxLoginAttempts ? "border-red-500" : ""}
                    />
                    {formErrors.security?.maxLoginAttempts && (
                      <p className="text-sm text-red-500">{formErrors.security.maxLoginAttempts}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">{t("passwordMinLength")}</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="8"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                      className={formErrors.security?.passwordMinLength ? "border-red-500" : ""}
                    />
                    {formErrors.security?.passwordMinLength && (
                      <p className="text-sm text-red-500">{formErrors.security.passwordMinLength}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ipWhitelist">{t("ipWhitelist")}</Label>
                    <Input
                      id="ipWhitelist"
                      placeholder="192.168.1.1, 10.0.0.0/8"
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("ipWhitelistDescription")}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="requireTwoFactor">{t("requireTwoFactor")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("requireTwoFactorDescription")}
                      </p>
                    </div>
                    <Switch
                      id="requireTwoFactor"
                      checked={securitySettings.requireTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireTwoFactor: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableAuditLog">{t("enableAuditLog")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("enableAuditLogDescription")}
                      </p>
                    </div>
                    <Switch
                      id="enableAuditLog"
                      checked={securitySettings.enableAuditLog}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableAuditLog: checked }))}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? t("saving") : t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t("billingConfiguration")}
                </CardTitle>
                <CardDescription>
                  {t("billingConfigurationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">{t("defaultCurrency")}</Label>
                    <Select value={billingSettings.defaultCurrency} onValueChange={(value: "USD" | "QAR" | "EUR") => setBillingSettings(prev => ({ ...prev, defaultCurrency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">{t("defaultTaxRate")} (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={billingSettings.taxRate}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      className={formErrors.billing?.taxRate ? "border-red-500" : ""}
                    />
                    {formErrors.billing?.taxRate && (
                      <p className="text-sm text-red-500">{formErrors.billing.taxRate}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">{t("gracePeriod")} (days)</Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      min="0"
                      value={billingSettings.gracePeriod}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 7 }))}
                      className={formErrors.billing?.gracePeriod ? "border-red-500" : ""}
                    />
                    {formErrors.billing?.gracePeriod && (
                      <p className="text-sm text-red-500">{formErrors.billing.gracePeriod}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">{t("reminderDays")}</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      min="1"
                      value={billingSettings.reminderDays}
                      onChange={(e) => setBillingSettings(prev => ({ ...prev, reminderDays: parseInt(e.target.value) || 3 }))}
                      className={formErrors.billing?.reminderDays ? "border-red-500" : ""}
                    />
                    {formErrors.billing?.reminderDays && (
                      <p className="text-sm text-red-500">{formErrors.billing.reminderDays}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoSuspend">{t("autoSuspend")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("autoSuspendDescription")}
                      </p>
                    </div>
                    <Switch
                      id="autoSuspend"
                      checked={billingSettings.autoSuspend}
                      onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, autoSuspend: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sendReminders">{t("sendReminders")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("sendRemindersDescription")}
                      </p>
                    </div>
                    <Switch
                      id="sendReminders"
                      checked={billingSettings.sendReminders}
                      onCheckedChange={(checked) => setBillingSettings(prev => ({ ...prev, sendReminders: checked }))}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveBillingSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? t("saving") : t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t("systemInformation")}
                </CardTitle>
                <CardDescription>
                  {t("systemInformationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("platformVersion")}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v1.0.0</Badge>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">{t("upToDate")}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t("databaseStatus")}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{t("connected")}</Badge>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("totalStores")}</Label>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-sm text-muted-foreground">
                      2 {t("active")}, 1 {t("suspended")}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t("totalUsers")}</Label>
                    <div className="text-2xl font-bold">25</div>
                    <p className="text-sm text-muted-foreground">
                      {t("acrossAllStores")}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">{t("systemActions")}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button variant="outline" className="justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      {t("backupDatabase")}
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t("clearCache")}
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      {t("exportData")}
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {t("systemLogs")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/admin/login">
      <AdminSettingsPageContent />
    </ProtectedRoute>
  );
}
