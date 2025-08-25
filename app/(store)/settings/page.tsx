"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "@/lib/i18n/hooks";
import { useStore } from "@/lib/hooks/useStore";
import { z } from "zod";
import { toast } from "sonner";
import { StoreLoadingWrapper } from "@/components/store/StoreLoadingWrapper";
import { UserManagementTable } from "@/components/store/user-management/UserManagementTable";
import { Settings, Users, User, Store, Bell, Shield, Globe, Palette, Save, Plus } from "lucide-react";

// Zod schemas for validation
const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
});

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  theme: z.enum(["light", "dark", "system"]),
});

function SettingsPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  
  return (
    <StoreLoadingWrapper>
      <SettingsContent />
    </StoreLoadingWrapper>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const { direction, locale } = useLocale();
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  
  // At this point, currentStore is guaranteed to be non-null due to StoreLoadingWrapper
  if (!currentStore) return null;

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    name: "My Store",
    description: "A great online store",
    address: "123 Main St, City, Country",
    phone: "+1 234 567 8900",
    website: "https://mystore.com",
    timezone: "UTC",
    currency: "USD",
  });
  
  // Profile state
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    language: string;
    theme: "light" | "dark" | "system";
  }>({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    language: "en",
    theme: "system",
  });
  
  // Remove user management state since it's now handled by UserManagementTable component

  const timezones = [
    "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Dubai"
  ];
  
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  ];
  
  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "العربية" },
  ];

  // Remove role badge functions since they're now handled by UserManagementTable component

  const handleStoreSettingsSave = () => {
    try {
      storeSettingsSchema.parse(storeSettings);
      toast.success("Store settings saved successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleProfileSave = () => {
    try {
      profileSchema.parse(profile);
      toast.success("Profile updated successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("store.settings.description")}</p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("profile")}
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {t("store")}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("users")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("preferences")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("profile")}
                </CardTitle>
                <CardDescription>{t("manageYourProfile")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">{t("name")}</Label>
                    <Input
                      id="profileName"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">{t("email")}</Label>
                    <Input
                      id="profileEmail"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profilePhone">{t("phone")}</Label>
                    <Input
                      id="profilePhone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileLanguage">{t("language")}</Label>
                    <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profileTheme">{t("theme")}</Label>
                  <Select value={profile.theme} onValueChange={(value: "light" | "dark" | "system") => setProfile(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("light")}</SelectItem>
                      <SelectItem value="dark">{t("dark")}</SelectItem>
                      <SelectItem value="system">{t("system")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleProfileSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {t("save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Tab */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {t("storeSettings")}
                </CardTitle>
                <CardDescription>{t("manageStoreConfiguration")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">{t("storeName")}</Label>
                    <Input
                      id="storeName"
                      value={storeSettings.name}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">{t("phone")}</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeDescription">{t("description")}</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeSettings.description}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">{t("address")}</Label>
                  <Textarea
                    id="storeAddress"
                    value={storeSettings.address}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeWebsite">{t("website")}</Label>
                    <Input
                      id="storeWebsite"
                      type="url"
                      value={storeSettings.website}
                      onChange={(e) => setStoreSettings(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeTimezone">{t("timezone")}</Label>
                    <Select value={storeSettings.timezone} onValueChange={(value) => setStoreSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeCurrency">{t("currency")}</Label>
                  <Select value={storeSettings.currency} onValueChange={(value) => setStoreSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name} ({curr.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleStoreSettingsSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {t("save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagementTable />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("preferences")}
                </CardTitle>
                <CardDescription>{t("customizeYourExperience")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">{t("notifications")}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">{t("emailNotifications")}</Label>
                        <p className="text-sm text-muted-foreground">{t("receiveEmailUpdates")}</p>
                      </div>
                      <Switch id="emailNotifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="orderNotifications">{t("orderNotifications")}</Label>
                        <p className="text-sm text-muted-foreground">{t("notifyOnNewOrders")}</p>
                      </div>
                      <Switch id="orderNotifications" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="inventoryNotifications">{t("inventoryNotifications")}</Label>
                        <p className="text-sm text-muted-foreground">{t("notifyOnLowStock")}</p>
                      </div>
                      <Switch id="inventoryNotifications" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">{t("security")}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactorAuth">{t("twoFactorAuthentication")}</Label>
                        <p className="text-sm text-muted-foreground">{t("enhanceAccountSecurity")}</p>
                      </div>
                      <Switch id="twoFactorAuth" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sessionTimeout">{t("sessionTimeout")}</Label>
                        <p className="text-sm text-muted-foreground">{t("autoLogoutAfterInactivity")}</p>
                      </div>
                      <Switch id="sessionTimeout" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">{t("dataAndPrivacy")}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataExport">{t("dataExport")}</Label>
                        <p className="text-sm text-muted-foreground">{t("exportYourData")}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {t("export")}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dataDeletion">{t("dataDeletion")}</Label>
                        <p className="text-sm text-muted-foreground">{t("permanentlyDeleteData")}</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600">
                        {t("delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Remove the entire Add/Edit User Dialog section */}
      </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
