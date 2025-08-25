import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedApiClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create a temporary Supabase client for authentication
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabaseClient = createServerSupabaseClient();

    // Sign in the user with email and password
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user data from the users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, name')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      );
    }

    // Check if user is a super admin
    const { data: systemUser, error: systemUserError } = await supabaseClient
      .from('system_users')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    const isSuperAdmin = !systemUserError && systemUser?.role === 'super_admin';

    // Store users should not be super admins
    if (isSuperAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Super admin users should use admin login.' },
        { status: 403 }
      );
    }

    // Create a response with user data
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        isSuperAdmin: false,
      }
    });

    return response;

  } catch (error) {
    console.error('Store login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
