import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createServerSupabaseClient();

    // Step 1: Create the user account with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Step 2: Insert user data into the users table
    const { error: insertError } = await supabaseClient
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
      });
    
    if (insertError) {
      // If inserting into users table fails, we should clean up the auth user
      // For now, we'll just log the error and return it
      console.error('Failed to insert user into users table:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ 
      success: true, 
      user: {
        id: authData.user.id,
        email,
        name,
        isSuperAdmin: false,
      },
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Store signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
