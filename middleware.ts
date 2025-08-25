import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { languages, defaultLanguage } from './lib/i18n/config';

export async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/locales') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // Skip Supabase session handling for API routes to avoid duplicate auth calls
  if (!pathname.startsWith('/api')) {
    // Handle Supabase session for non-API routes only
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // This will refresh session if expired - required for Database Auth
    await supabase.auth.getUser();
  }

  // Skip locale handling for API routes
  if (pathname.startsWith('/api')) {
    return response;
  }

  // Get locale from cookie or accept-language header
  let locale = defaultLanguage;
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  if (cookieLocale && languages.includes(cookieLocale as any)) {
    locale = cookieLocale as any;
  } else {
    // Check accept-language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim())
        .find(lang => languages.includes(lang as any));
      
      if (preferredLocale) {
        locale = preferredLocale as any;
      }
    }
  }

  // Set locale in headers for server components to use
  response.headers.set('x-locale', locale);
  
  return response;
}

export const config = {
  matcher: [
    // Include all paths except static files and internal Next.js paths
    '/((?!_next|locales|favicon.ico).*)',
  ],
};
