import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { getLocale, getDirection } from '@/lib/i18n/server';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

const notoNaskhArabic = Noto_Naskh_Arabic({ 
  subsets: ["arabic"],
  variable: '--font-noto-naskh-arabic'
});

export const metadata: Metadata = {
  title: "Multi-tenant Orders Dashboard",
  description: "Manage orders across multiple stores with role-based access control",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const direction = await getDirection();

  return (
    <html lang={locale} dir={direction}>
      <body className={`${inter.variable} ${notoNaskhArabic.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster position={direction === 'rtl' ? 'top-left' : 'top-right'} />
        </AuthProvider>
      </body>
    </html>
  );
}


