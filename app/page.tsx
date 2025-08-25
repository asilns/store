import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { getTranslations, getDirection } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";
import Link from "next/link";

export default async function LandingPage() {
  const t = await getTranslations();
  const direction = await getDirection();
  const locale = await getLocale();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight" lang={locale}>
            {t.appTitle}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground" lang={locale}>
            {t.dashboard} - {t.orders} {t.and} {t.products} {t.management}
          </p>
          <div className={`mt-8 flex items-center justify-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Button size="lg" asChild>
              <Link href="/signup">{t.getStarted}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={"/admin/login" as any}>{t.adminLogin}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold" lang={locale}>{t.unifiedOrderManagement}</h3>
              <p className="mt-2 text-sm text-muted-foreground" lang={locale}>
                {t.unifiedOrderManagementDesc}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold" lang={locale}>{t.productCatalog}</h3>
              <p className="mt-2 text-sm text-muted-foreground" lang={locale}>
                {t.productCatalogDesc}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold" lang={locale}>{t.analyticsReady}</h3>
              <p className="mt-2 text-sm text-muted-foreground" lang={locale}>
                {t.analyticsReadyDesc}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl text-center">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-semibold" lang={locale}>{t.readyToStreamline}</h2>
              <p className="mt-2 text-muted-foreground" lang={locale}>
                {t.createStoreAccount}
              </p>
              <div className="mt-6">
                <Button size="lg" asChild>
                  <Link href="/signup">{t.getStarted}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}


