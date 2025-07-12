import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=Invalid+code`);
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth error:', error.message);
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`);
    }

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User fetch error:', userError.message);
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(userError.message)}`);
    }

    if (user) {
      // Check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError.message);
        return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(profileError.message)}`);
      }

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Profile creation error:', insertError.message);
          return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(insertError.message)}`);
        }
      }
    }

    // Redirect to the specified URL or dashboard
    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`);
  }
}

export const dynamic = 'force-dynamic';