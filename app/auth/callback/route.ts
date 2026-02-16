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
    // This will set the session cookies automatically
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Check if this is a password recovery flow
    // Recovery links come through with type=recovery in the params
    if (searchParams.get("type") === "recovery") {
      // For password recovery, redirect to reset password page
      // The recovery session is now in cookies and will be used to update password
      const response = NextResponse.redirect(new URL("/auth/reset-password", request.url));
      return response;
    }

    // For regular OAuth/email signups, create profile if needed
    if (data.user) {
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
