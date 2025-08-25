import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface AuthenticatedApiClient {
  client: ReturnType<typeof createServerClient>;
  userId: string | null;
  error: string | null;
  isSuperAdmin: boolean;
}

/**
 * Creates an authenticated Supabase client for API routes
 * Handles both store users and super admin authentication
 */
export async function createAuthenticatedApiClient(
  request: NextRequest
): Promise<AuthenticatedApiClient> {
  try {

    // Create Supabase client with proper cookie handling for SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // In API routes, we can't set cookies directly
            // This is handled by the client
          },
          remove(name: string, options: any) {
            // In API routes, we can't remove cookies directly
            // This is handled by the client
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        client: supabase,
        userId: null,
        error: authError?.message || 'User not authenticated',
        isSuperAdmin: false
      };
    }

    // Check if user is a super admin from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = !userError && userData?.role === 'super_admin';

    return {
      client: supabase,
      userId: user.id,
      error: null,
      isSuperAdmin
    };

  } catch (error) {
    console.error('Error creating authenticated API client:', error);
    return {
      client: createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: () => '', set: () => {}, remove: () => {} } }
      ),
      userId: null,
      error: 'Internal server error',
      isSuperAdmin: false
    };
  }
}

/**
 * Creates a Supabase client for server-side operations (no auth required)
 */
export function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: () => '', set: () => {}, remove: () => {} }
    }
  );
}
