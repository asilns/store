import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
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

    // Check if user has super_admin role in users table
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      // .single();
    
    console.log('====================');
    console.log(userData);
    console.log(userError);

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      );
    }

    // Check if the user has super_admin role
    if (userData.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access denied. Super admin privileges required.' },
        { status: 403 }
      );
    }

    // Create a response with user data
    const response = NextResponse.json({ 
      success: true, 
      role: userData.role,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
      }
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}