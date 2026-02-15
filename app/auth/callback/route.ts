import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=No code provided", request.url));
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Check if this is a password recovery flow
    const type = searchParams.get("type");
    if (type === "recovery") {
      // For password recovery, sign out the user to ensure they authenticate with new password
      // then redirect to reset password page
      await supabase.auth.signOut();
      
      // Create response and explicitly clear auth cookies to force fresh session
      const response = NextResponse.redirect(new URL("/auth/reset-password", request.url));
      // Clear Supabase auth cookies
      response.cookies.delete('sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token');
      response.cookies.delete('sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token.0');
      response.cookies.delete('sb-' + supabaseUrl?.split('//')[1]?.split('.')[0] + '-auth-token.1');
      return response;
    }

    if (data.user) {
      // Check if profile exists
      const admin = createServiceRoleClient();
      const { data: profileData, error: profileError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      // If profile doesn't exist, create it (for Google OAuth signups)
      if (!profileData && !profileError) {
        const fullName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User";
        
        await admin.from("profiles").insert([
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: "user",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }

    // Redirect to home page after successful authentication
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=Authentication failed", request.url)
    );
  }
}
